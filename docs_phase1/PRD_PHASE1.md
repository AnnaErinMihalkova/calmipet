# CalmiPet – Phase 1 PRD

## 1. Product Vision
Help students notice stress, self‑regulate through guided breathing, and build a calm habit via an empathetic virtual pet.

## 2. Problem Statement
Students often struggle to recognize rising stress and to take brief, effective recovery actions. Tools feel clinical or heavy; they need a fast, friendly prompt to reset.

## 3. Phase 1 Goals
- Deliver an end‑to‑end demo that signs up/logs in, shows simulated readings/trends, and guides a short breathing exercise.
- Reflect stress changes through a virtual pet’s mood and a simple streak.

## 4. Primary User Persona
See `docs/PERSONA_PHASE1.md`.

## 5. Core Features (Phase 1)
- Auth & Onboarding: Email/password; age/gender/baseline HR; daily stress rating (1–10)
- Dashboard: Pet mood card; trend bars; breathing coach; recent readings; theme toggle
- Data: Readings CRUD; simulated “Add Test Reading”; threshold‑based stress triggers
- Gamification: Calm streak increments after breathing completion; simple accessory unlock

## 6. Non‑Goals (Out of Scope)
- Live sensor streaming, notifications, admin/analytics, advanced ML, native apps, complex pet graphics

## 7. Assumptions & Constraints
- Localhost dev with SQLite and session cookies
- Simple threshold stress logic (BPM above baseline+10 or HRV < 30)
- Minimal personal info (no phone numbers), privacy‑aware design

## 8. Technology Stack (Phase 1)
- Frontend: React + TypeScript (CRA), static build served at `localhost:3001`
- Backend: Django REST at `127.0.0.1:8000`, session auth, CORS for localhost
- DB: SQLite for dev; Postgres optional later

## 9. Phase 1 Success Metrics
- Sign‑up success rate and login success rate on localhost
- Time to complete a breathing session (≤ 2 minutes)
- Daily calm streak increments recorded
- No blocking console errors; backend uptime during demo

---

References
- Endpoints & serializers: `backend/backend/urls.py:17–23`, `backend/api/serializers.py:16–39, 42–62`
- Frontend routing & pages: `frontend/src/App.tsx:74–119`