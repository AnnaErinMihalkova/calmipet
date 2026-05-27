/**
 * Bridge between React Native WebView (native BLE) and ble-device.ts.
 * The mobile app injects events; this module forwards them to registered callbacks.
 */

import type { BleReading } from './ble-device';

export type NativeBleEvent =
  | { type: 'status'; connected: boolean }
  | { type: 'reading'; reading: BleReading }
  | { type: 'error'; message: string }
  | { type: 'ready' };

type WindowWithBridge = Window & {
  ReactNativeWebView?: { postMessage: (data: string) => void };
  __CALMIPET_NATIVE_BLE__?: boolean;
};

export function isNativeAppWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as WindowWithBridge;
  return Boolean(w.__CALMIPET_NATIVE_BLE__ || w.ReactNativeWebView);
}

export function postToNativeApp(message: Record<string, unknown>): void {
  const w = window as WindowWithBridge;
  w.ReactNativeWebView?.postMessage(JSON.stringify(message));
}

export function openNativeBluetoothSettings(): void {
  postToNativeApp({ type: 'OPEN_BLUETOOTH_SETTINGS' });
}

let connectResolve: (() => void) | null = null;
let connectReject: ((err: Error) => void) | null = null;

export function waitForNativeConnect(): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      connectResolve = null;
      connectReject = null;
      reject(new Error('Connection timed out. Make sure CalmIPet is on and nearby.'));
    }, 45000);

    connectResolve = () => {
      window.clearTimeout(timer);
      connectResolve = null;
      connectReject = null;
      resolve();
    };
    connectReject = (err: Error) => {
      window.clearTimeout(timer);
      connectResolve = null;
      connectReject = null;
      reject(err);
    };
  });
}

export function resolveNativeConnect(): void {
  connectResolve?.();
  connectResolve = null;
  connectReject = null;
}

export function rejectNativeConnect(message: string): void {
  connectReject?.(new Error(message));
  connectResolve = null;
  connectReject = null;
}

export function subscribeNativeBleEvents(handlers: {
  onStatus: (connected: boolean) => void;
  onReading: (reading: BleReading) => void;
  onError: (message: string) => void;
}): () => void {
  const listener = (ev: Event) => {
    const detail = (ev as CustomEvent<NativeBleEvent>).detail;
    if (!detail?.type) return;

    if (detail.type === 'status') {
      handlers.onStatus(detail.connected);
      if (detail.connected) resolveNativeConnect();
    }
    if (detail.type === 'reading') handlers.onReading(detail.reading);
    if (detail.type === 'error') {
      handlers.onError(detail.message);
      rejectNativeConnect(detail.message);
    }
  };

  window.addEventListener('calmipet-ble-native', listener);
  return () => window.removeEventListener('calmipet-ble-native', listener);
}
