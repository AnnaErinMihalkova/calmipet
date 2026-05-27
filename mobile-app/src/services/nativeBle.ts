import { PermissionsAndroid, Platform } from 'react-native'
import { BleManager, Device, Subscription } from 'react-native-ble-plx'
import { CALMIPET_BLE } from '../constants/ble'

export type BleReadingPayload = {
  heart_rate: number
  spo2: number
  hrv: number
}

let manager: BleManager | null = null
let device: Device | null = null
let monitorSub: Subscription | null = null

function getManager(): BleManager {
  if (!manager) manager = new BleManager()
  return manager
}

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') return true

  const version = Platform.Version
  if (typeof version === 'number' && version >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN!,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT!,
    ])
    return (
      result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED &&
      result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED
    )
  }

  const fine = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION!
  )
  return fine === PermissionsAndroid.RESULTS.GRANTED
}

function decodeBase64Utf8(base64: string): string {
  const binary = atob(base64)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder('utf-8').decode(bytes)
}

export function parseBlePayload(raw: string): BleReadingPayload | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>
    const hr = data.heart_rate ?? data.hr ?? data.bpm
    if (hr == null || Number.isNaN(Number(hr))) return null
    const spo2 = data.spo2 ?? data.SpO2
    const hrv = data.hrv ?? data.HRV
    return {
      heart_rate: Number(hr),
      spo2: spo2 != null && !Number.isNaN(Number(spo2)) ? Number(spo2) : 0,
      hrv: hrv != null && !Number.isNaN(Number(hrv)) ? Number(hrv) : 0,
    }
  } catch {
    return null
  }
}

function matchesCalmipet(scanned: Device): boolean {
  const name = scanned.name || scanned.localName || ''
  if (name === CALMIPET_BLE.deviceName || name.includes('CalmIPet')) return true
  return (scanned.serviceUUIDs ?? []).some(
    (u) => u.toLowerCase() === CALMIPET_BLE.serviceUuid.toLowerCase()
  )
}

export async function connectNativeBle(
  onReading: (r: BleReadingPayload) => void,
  onStatus: (connected: boolean) => void
): Promise<void> {
  const permitted = await requestBlePermissions()
  if (!permitted) {
    throw new Error('Bluetooth permission denied. Allow Bluetooth in your phone Settings.')
  }

  const ble = getManager()
  const state = await ble.state()
  if (state === 'PoweredOff') {
    throw new Error('Bluetooth is off. Turn on Bluetooth in your phone Settings, then try again.')
  }

  await disconnectNativeBle(() => {})

  return new Promise((resolve, reject) => {
    let settled = false
    const timeout = setTimeout(() => {
      ble.stopDeviceScan().catch(() => {})
      if (!settled) {
        settled = true
        reject(
          new Error(
            'CalmIPet not found. Power on the bracelet, keep it near your phone, and try again.'
          )
        )
      }
    }, 25000)

    ble.startDeviceScan([CALMIPET_BLE.serviceUuid], { allowDuplicates: false }, async (error, scanned) => {
      if (error) {
        clearTimeout(timeout)
        ble.stopDeviceScan().catch(() => {})
        if (!settled) {
          settled = true
          reject(error)
        }
        return
      }
      if (!scanned || !matchesCalmipet(scanned)) return

      clearTimeout(timeout)
      await ble.stopDeviceScan().catch(() => {})

      try {
        device = await scanned.connect({ timeout: 20000 })
        await device.discoverAllServicesAndCharacteristics()

        monitorSub = device.monitorCharacteristicForService(
          CALMIPET_BLE.serviceUuid,
          CALMIPET_BLE.readingCharUuid,
          (err, characteristic) => {
            if (err) return
            const val = characteristic?.value
            if (!val) return
            const parsed = parseBlePayload(decodeBase64Utf8(val))
            if (parsed && parsed.heart_rate > 0) onReading(parsed)
          }
        )

        device.onDisconnected(() => {
          monitorSub?.remove()
          monitorSub = null
          device = null
          onStatus(false)
        })

        if (!settled) {
          settled = true
          onStatus(true)
          resolve()
        }
      } catch (e) {
        if (!settled) {
          settled = true
          reject(e instanceof Error ? e : new Error('Could not connect to CalmIPet.'))
        }
      }
    })
  })
}

export async function disconnectNativeBle(onStatus: (connected: boolean) => void): Promise<void> {
  const ble = getManager()
  await ble.stopDeviceScan().catch(() => {})

  monitorSub?.remove()
  monitorSub = null

  if (device) {
    try {
      await device.cancelConnection()
    } catch {
      /* already disconnected */
    }
    device = null
  }

  onStatus(false)
}

export function buildBleWebInject(detail: Record<string, unknown>): string {
  const json = JSON.stringify(detail)
  return `(function(){try{window.dispatchEvent(new CustomEvent('calmipet-ble-native',{detail:${json}}));}catch(e){console.warn(e);}})();true;`
}
