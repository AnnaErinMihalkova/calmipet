# CalmiPet — Sensor Strategy (Phase 1)

## Approach: Simulated Bracelet
- Why simulation: Keeps Phase 1 focused on UX and core flows without BLE pairing, device drivers, or hardware debugging. Ensures a predictable demo and testability.

## Simulated Data
- Heart Rate (HR, bpm): integer 50–110 typical; stress spikes 95–130
- HRV (RMSSD, ms): integer 15–80 typical; low values (10–30) indicate stress
- Grip Pressure (arb units): integer 0–100; optional; higher under stress

## Generation Logic (High Level)
- Baseline HR around 70 bpm; add small random noise (±5)
- Stress episode: 60–120s windows where HR rises +15–30 and HRV dips 10–25
- Pressure correlates with stress windows (increase 20–40)
- Sampling: every 30–90 seconds for general use; on “Add Test Reading,” generate one sample immediately

## Backend Integration
- Frontend “Add Test Reading” triggers a POST to `/api/readings/` with JSON payload
- Payload fields: `ts` (ISO 8601), `hr_bpm`, `hrv_rmssd`, optional `grip_force`
- Backend stores to SQLite and returns created object; UI refreshes lists and charts

## Path to Real Hardware
- Replace generator with ESP32/bracelet firmware that posts readings over Wi‑Fi
- Use a minimal token header and POST JSON to `/api/readings/`
- Optional BLE: mobile gateway collects GATT characteristics and forwards to backend
- Maintain identical JSON contract so UI and backend remain unchanged