# Supported User Flows — Phase 1

- Sign up
  - Open app → Click “Start calming” → Enter username + email + password → Submit → Session set → Onboarding info form → Save → Home
- Log in
  - Open app → Click “I already have an account” → Enter email + password → Submit → Session set → Home
- Viewing heart rate readings
  - Home → Recent Readings card → List shows date, BPM, HRV → Click “Add Test Reading” to create a sample
- Viewing trends
  - Home → Trend card → Bars show last 20 BPM values → Hover to view time/BPM
- Breathing exercise flow
  - Home → Coach card → “Start Breathing” → Overlay opens → Follow inhale/exhale → Complete → Streak increments → Pet calms
- Virtual pet state change
  - New reading arrives → Stress rule checks (BPM baseline+10 or HRV < 30) → If true, pet shows “worried” and coach prompt appears → After breathing completion, pet mood returns to “calm”
- Exporting data (Phase 1 basic)
  - Deferred: Use readings endpoint; CSV export planned post‑sprint