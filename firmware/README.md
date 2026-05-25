# CalmIPet ESP32 firmware

Firmware for **ESP32-C3 Super Mini** that reads MAX30102 vitals, drives LCD/motor alerts, and streams JSON over **BLE** to the web app.

## Wiring

| Signal | GPIO |
|--------|------|
| I2C SDA | 8 |
| I2C SCL | 9 |
| MAX30102 | 0x57 |
| LCD1602 (I2C backpack) | 0x27 |
| Vibration motor | 2 |

## Arduino libraries (Library Manager)

1. **SparkFun MAX3010x Pulse and Proximity Sensor Library** (includes `heartRate.h`, `spo2_algorithm.h`)
2. **LiquidCrystal I2C** (Frank de Brabander)

ESP32 BLE libraries ship with the **esp32** board package.

## Board settings

- Board: **ESP32C3 Dev Module**
- USB CDC On Boot: **Enabled**
- Partition: default (BLE needs ~1.5 MB flash)

Open and upload: `firmware/calmipet_esp32/calmipet_esp32.ino`

On boot the device advertises as **`CalmIPet`**.

## BLE protocol (must match `frontend/src/services/ble-device.ts`)

| Item | UUID |
|------|------|
| Service | `a7b3c4d0-1234-5678-9abc-def012345678` |
| Reading (notify) | `a7b3c4d0-1234-5678-9abc-def012345679` |

Notification payload (UTF-8 JSON):

```json
{"heart_rate":72,"spo2":98,"hrv":42}
```

Sent every **3 s** while a browser is connected and a finger is on the sensor.

## Web app connection

1. **Chrome or Edge** (desktop or Android) — Web Bluetooth required
2. Log in to CalmIPet, open the dashboard **ESP32 Bluetooth** section
3. Click **Connect ESP32**, choose **CalmIPet**
4. Readings upload to `POST /api/data` (throttled to ~5 s in the browser); stress is computed on the server

iOS Safari does **not** support Web Bluetooth.

## Source files from `bluetooth.zip`

| Zip file | Project location |
|----------|------------------|
| `calmipet_esp32c3_ble.ino` | `firmware/calmipet_esp32/calmipet_esp32.ino` |
| `ble-device.ts` | `frontend/src/services/ble-device.ts` |
| `BleDevicePanel.tsx` | `frontend/src/components/BleDevicePanel.tsx` |
