# Phase 1 Success Criteria — CalmiPet

## What “70% Working End‑to‑End” Means
A functional MVP that lets a student sign up, log in, provide a simple onboarding check‑in, view simulated heart readings and trends, perform a breathing exercise, and see the virtual pet react to stress signals — reliably on localhost.

## Functional Requirements
- Auth and sessions
  - Email/password sign up and login using session cookies
  - Onboarding info form: age (optional), gender (optional), baseline HR (optional), daily stress rating (1–10)
- Dashboard experience
  - Theme toggle (dark/light) with full dark input states
  - Virtual pet card shows mood: “worried” when stress signals detected, “calm” otherwise
  - Bar chart trend of last 20 BPM readings
  - Breathing coach overlay with inhale/exhale cycle and 60s timer
  - Recent readings list with an “Add Test Reading” button
- Gamification & tracking
  - Calm streak increments on breathing completion and displays on pet card
- Data model & logic
  - Reading fields: `user`, `ts`, `hr_bpm`, `hrv_rmssd` (optional `grip_force`, `posture_score`)
  - Stress detection: BPM above baseline+10 or HRV < 30 triggers breathing prompt

## Technical Requirements
- Local dev stack
  - Backend runs at `http://127.0.0.1:8000/` with SQLite (no external DB required)
  - Frontend served at `http://localhost:3001/` (static build)
  - REST endpoints for auth and readings reachable from frontend
- Auth and CORS
  - Session cookies with SameSite Lax for localhost
  - CORS allows the frontend origins and credentials
- Code quality & stability
  - TypeScript front end compiles and runs
  - Basic error and loading states (no unhandled exceptions in console)
  - Inputs render fully dark in dark mode (including autofill)

## Explicitly NOT Included in Phase 1
- Real sensor streaming over BLE/WiFi
- Advanced analytics beyond simple averages and thresholds
- Push notifications, haptics, complex pet graphics/animation
- Admin dashboard, password reset emails, multi‑device sync
- Machine learning personalization or anomaly detection

---

References
- Auth endpoints: `backend/backend/urls.py:17–23`, `backend/api/views.py:23–57`, `backend/api/serializers.py:16–39, 42–62`
- Readings API: `frontend/src/services/api.ts:20–49`
- Dark mode inputs: `frontend/src/index.css:84–124`, `frontend/src/components/Login.css:113–203`, `frontend/src/components/SignUp.css:113–203`
- CORS/cookies: `backend/backend/settings.py:132–147`