# CalmiPet — UX Acceptance Criteria (Phase 1)

## Authentication
- Given a new user on Sign Up
  - When they submit valid username, email, and password
  - Then a session is created and they reach onboarding within 2s
- Given an existing user on Log In
  - When they submit correct email and password
  - Then they reach Home with no error banner
- Given invalid credentials
  - When they submit
  - Then an inline error explains the issue without a page reload

## Stress Detection
- Given baseline HR is set (or default 70)
  - When a reading arrives with BPM ≥ baseline + 10 OR HRV < 30
  - Then the system flags “stressed” within 500ms on the UI
- Given normal readings
  - When BPM < baseline + 10 AND HRV ≥ 30
  - Then the system shows “calm” state

## Virtual Pet Behavior
- Given a stressed state
  - When the dashboard renders
  - Then pet shows “worried” and prompts breathing
- Given breathing completion
  - When the session timer reaches 60s
  - Then pet returns to “calm” and streak increments by 1

## Breathing Exercises
- Given the user starts breathing
  - When inhale/exhale guidance runs for 60s
  - Then a completion toast appears and coach overlay closes
- Given cancel
  - When the user presses Cancel
  - Then overlay closes with no streak change

## Charts and Trends
- Given at least 5 readings exist
  - When opening the Home trend card
  - Then 20 most recent BPM values render as bars with hover tooltips
- Given HRV values
  - When the Trends screen loads
  - Then HRV sparkline renders and matches raw values within ±1 unit

## Export Functionality (Phase 1 basic)
- Given readings exist
  - When the user presses “Export CSV” (or endpoint called)
  - Then a CSV file is generated with headers (ts, bpm, hrv)