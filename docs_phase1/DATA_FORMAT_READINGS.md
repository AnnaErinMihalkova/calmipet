# CalmiPet — Heart Rate Readings (Phase 1)

## JSON Schema (Simplified)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CalmiPetReading",
  "type": "object",
  "required": ["user", "ts", "hr_bpm"],
  "properties": {
    "user": {"type": "integer", "minimum": 1},
    "ts": {"type": "string", "format": "date-time"},
    "hr_bpm": {"type": "integer", "minimum": 30, "maximum": 220},
    "hrv_rmssd": {"type": "integer", "minimum": 5, "maximum": 200},
    "grip_force": {"type": "integer", "minimum": 0, "maximum": 100},
    "posture_score": {"type": "integer", "minimum": 0, "maximum": 100}
  },
  "additionalProperties": false
}
```

## Field Descriptions
- `user`: User id (server-side resolves to authenticated session)
- `ts`: ISO 8601 timestamp (`YYYY-MM-DDTHH:MM:SSZ`)
- `hr_bpm`: Heart rate (beats per minute)
- `hrv_rmssd`: HRV RMSSD estimate (ms), optional
- `grip_force`: Pressure proxy (0–100), optional
- `posture_score`: Uprightness proxy (0–100), optional

## Validation Rules
- `hr_bpm` must be an integer within [30, 220]
- If supplied, `hrv_rmssd` must be an integer within [5, 200]
- `ts` must parse as a valid UTC date-time
- Extra fields are ignored or rejected (server config dependent)

## Example Payloads
```json
{
  "ts": "2025-12-15T12:00:00Z",
  "hr_bpm": 76,
  "hrv_rmssd": 42
}
```
```json
{
  "ts": "2025-12-15T12:01:00Z",
  "hr_bpm": 104,
  "hrv_rmssd": 18,
  "grip_force": 58
}
```

## Simulated Data Generation Logic
- Baseline HR: 70 bpm, noise ±5
- Stress windows: +15–30 bpm rise; HRV dips to 10–25
- Randomize sample intervals: 30–90s
- “Add Test Reading” uses current time and a random state (calm or stressed)