/**
 * Web Bluetooth client for CalmIPet ESP32-C3.
 * UUIDs must match firmware/calmipet_esp32/calmipet_esp32.ino
 */

import { readingService } from './api';

export const CALMIPET_BLE = {
  deviceName: 'CalmIPet',
  serviceUuid: 'a7b3c4d0-1234-5678-9abc-def012345678',
  readingCharUuid: 'a7b3c4d0-1234-5678-9abc-def012345679',
} as const;

const SERVICE_UUID = CALMIPET_BLE.serviceUuid;
const CHARACTERISTIC_UUID = CALMIPET_BLE.readingCharUuid;
const POST_INTERVAL_MS = 5000;

export interface BleReading {
  heart_rate: number;
  spo2: number;
  hrv: number;
}

/** @deprecated use BleReading */
export type BleVitals = {
  heart_rate: number;
  spo2?: number;
  hrv?: number;
};

export type BleConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

type ReadingCallback = (r: BleReading) => void;
type StatusCallback = (connected: boolean) => void;
type PostedCallback = () => void;

type BleNavigator = Navigator & {
  bluetooth: {
    requestDevice(options: {
      filters?: Array<{ name?: string; services?: string[] }>;
      optionalServices?: string[];
    }): Promise<BleDevice>;
  };
};

type BleDevice = EventTarget & {
  name?: string;
  gatt?: {
    connect(): Promise<BleGattServer>;
    connected: boolean;
    disconnect(): void;
  };
};

type BleGattServer = {
  getPrimaryService(uuid: string): Promise<BleGattService>;
};

type BleGattService = {
  getCharacteristic(uuid: string): Promise<BleGattCharacteristic>;
};

type BleGattCharacteristic = EventTarget & {
  startNotifications(): Promise<BleGattCharacteristic>;
  stopNotifications(): Promise<BleGattCharacteristic>;
  addEventListener(type: 'characteristicvaluechanged', listener: (ev: Event) => void): void;
  removeEventListener(type: 'characteristicvaluechanged', listener: (ev: Event) => void): void;
  value?: DataView;
};

let device: BleDevice | null = null;
let characteristic: BleGattCharacteristic | null = null;
let lastPostTime = 0;

let onReadingCb: ReadingCallback | null = null;
let onStatusCb: StatusCallback | null = null;
let onPostedCb: PostedCallback | null = null;

export function onReading(cb: ReadingCallback) {
  onReadingCb = cb;
}

export function onStatus(cb: StatusCallback) {
  onStatusCb = cb;
}

export function onPosted(cb: PostedCallback) {
  onPostedCb = cb;
}

export function isBleSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

/** @deprecated */
export function isWebBluetoothSupported(): boolean {
  return isBleSupported();
}

export function parseBlePayload(raw: string): BleVitals | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    const hr = data.heart_rate ?? data.hr ?? data.bpm;
    if (hr == null || Number.isNaN(Number(hr))) return null;
    const vitals: BleVitals = { heart_rate: Number(hr) };
    const spo2 = data.spo2 ?? data.SpO2;
    const hrv = data.hrv ?? data.HRV;
    if (spo2 != null && !Number.isNaN(Number(spo2))) vitals.spo2 = Number(spo2);
    if (hrv != null && !Number.isNaN(Number(hrv))) vitals.hrv = Number(hrv);
    return vitals;
  } catch {
    return null;
  }
}

export async function connectBle(): Promise<void> {
  if (!isBleSupported()) {
    throw new Error(
      'Web Bluetooth is not supported in this browser. Use Chrome or Edge on desktop or Android.'
    );
  }

  try {
    device = await (navigator as BleNavigator).bluetooth.requestDevice({
      filters: [{ name: CALMIPET_BLE.deviceName }, { services: [SERVICE_UUID] }],
      optionalServices: [SERVICE_UUID],
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'NotFoundError') {
      throw new Error('Device selection cancelled or no device found.');
    }
    throw err;
  }

  if (!device.gatt) throw new Error('No GATT server on device');

  // Remove old listener if re-connecting the same device object
  device.removeEventListener('gattserverdisconnected', handleDisconnect);
  device.addEventListener('gattserverdisconnected', handleDisconnect);

  await establishGattConnection();
}

/** Internal helper to connect to GATT and setup characteristics */
async function establishGattConnection(): Promise<void> {
  if (!device?.gatt) return;

  let server: BleGattServer;
  try {
    server = await device.gatt.connect();
  } catch (err) {
    console.error('BLE GATT connect error:', err);
    throw new Error('GATT Server connection failed. Make sure the device is on and in range.');
  }

  try {
    const service = await server.getPrimaryService(SERVICE_UUID);
    characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', handleNotification);

    onStatusCb?.(true);
  } catch (err) {
    console.error('BLE Service/Char discovery error:', err);
    throw new Error('Failed to discover services. Try restarting the device.');
  }
}


export async function disconnectBle(): Promise<void> {
  if (characteristic) {
    try {
      characteristic.removeEventListener('characteristicvaluechanged', handleNotification);
      await characteristic.stopNotifications();
    } catch {
      /* already disconnected */
    }
    characteristic = null;
  }
  if (device?.gatt?.connected) {
    try {
      device.gatt.disconnect();
    } catch (err) {
      console.warn('BLE disconnect error:', err);
    }
  }
  // We keep the device object but reset state
  onStatusCb?.(false);
}

export function isConnected(): boolean {
  return device?.gatt?.connected ?? false;
}

/** @deprecated */
export function isCalmipetBleConnected(): boolean {
  return isConnected();
}

function handleNotification(event: Event) {
  const target = event.target as BleGattCharacteristic;
  const value = target.value;
  if (!value) return;

  const text = new TextDecoder('utf-8').decode(value);
  const parsed = parseBlePayload(text);
  if (!parsed || parsed.heart_rate <= 0) {
    console.warn('CalmIPet BLE: bad JSON', text);
    return;
  }

  const reading: BleReading = {
    heart_rate: parsed.heart_rate,
    spo2: parsed.spo2 ?? 0,
    hrv: parsed.hrv ?? 0,
  };

  onReadingCb?.(reading);

  const now = Date.now();
  if (now - lastPostTime >= POST_INTERVAL_MS) {
    lastPostTime = now;
    postToBackend(reading).catch((err) => {
      console.error('CalmIPet BLE: failed to upload reading', err);
    });
  }
}

async function handleDisconnect() {
  characteristic = null;
  onStatusCb?.(false);
  
  // Optional: Attempt to reconnect once if the disconnection was unexpected
  if (device && !device.gatt?.connected) {
    console.log('CalmIPet BLE: unexpected disconnect, attempting auto-reconnect...');
    try {
      await establishGattConnection();
    } catch (e) {
      console.warn('CalmIPet BLE: auto-reconnect failed');
    }
  }
}

async function postToBackend(reading: BleReading): Promise<void> {
  const token = localStorage.getItem('calmipet-token');
  if (!token) return;

  await readingService.createReading({
    heart_rate: reading.heart_rate,
    spo2: reading.spo2 > 0 ? reading.spo2 : undefined,
    hrv: reading.hrv > 0 ? reading.hrv : undefined,
  });
  onPostedCb?.();
}

export type BleDeviceCallbacks = {
  onState?: (state: BleConnectionState, message?: string) => void;
  onReading?: (vitals: BleVitals) => void;
  onPosted?: (vitals: BleVitals) => void;
  onError?: (message: string) => void;
};

/** Legacy connect API (callbacks object) */
export async function connectCalmipetBle(callbacks: BleDeviceCallbacks = {}): Promise<void> {
  callbacks.onState?.('connecting', 'Opening device picker…');
  try {
    onReading((r) => callbacks.onReading?.(r));
    onStatus((connected) => {
      callbacks.onState?.(
        connected ? 'connected' : 'disconnected',
        connected ? device?.name || CALMIPET_BLE.deviceName : undefined
      );
    });
    onPosted(() => callbacks.onPosted?.({ heart_rate: 0, spo2: 0, hrv: 0 }));
    await connectBle();
    callbacks.onState?.('connected', device?.name || CALMIPET_BLE.deviceName);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Connection failed';
    callbacks.onState?.('error', message);
    callbacks.onError?.(message);
    throw err;
  }
}

/** @deprecated */
export async function disconnectCalmipetBle(): Promise<void> {
  await disconnectBle();
}
