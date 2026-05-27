/** Must match firmware/calmipet_esp32.ino and frontend/src/services/ble-device.ts */
export const CALMIPET_BLE = {
  deviceName: 'CalmIPet',
  serviceUuid: 'a7b3c4d0-1234-5678-9abc-def012345678',
  readingCharUuid: 'a7b3c4d0-1234-5678-9abc-def012345679',
} as const
