# HeartBuddy — Phase 1 Changelog

## Frontend
- Added themed dashboard with pet panel, trend bars, coach, and readings
  - `frontend/src/App.tsx` (routing, pages, dashboard content)
- Implemented dark/light theme via CSS variables; full dark inputs (incl. autofill)
  - `frontend/src/index.css:84–124`, `frontend/src/components/Login.css:113–203`, `frontend/src/components/SignUp.css:113–203`
- Onboarding info form (age, gender, baseline HR, daily stress 1–10)
  - `frontend/src/components/OnboardingInfo.tsx`
- Show/hide password toggles on Login/Sign Up
  - `frontend/src/components/Login.tsx:18–19, 124–137`, `frontend/src/components/SignUp.tsx:21–22, 168–182, 184–200`
- Reading list restyle; “Add Test Reading” to simulate data
  - `frontend/src/components/ReadingList.tsx`
- Breathing coach overlay with animation and timer
  - `frontend/src/components/BreathingCoach.tsx`

## Backend
- Auth endpoints (signup, login, current user)
  - `backend/backend/urls.py:17–23`, `backend/api/views.py:23–57`
- Serializers for sign up and login (email‑based login)
  - `backend/api/serializers.py:16–39, 42–62`
- Local dev DB defaults to SQLite, optional Postgres via env
  - `backend/backend/settings.py:100–110`
- CORS and cookie settings for localhost (SameSite Lax)
  - `backend/backend/settings.py:132–147`

## Running
- Backend: `python manage.py runserver` → `http://127.0.0.1:8000/`
- Frontend: `serve -s build -l 3001` → `http://localhost:3001/`

---

Known Limitations (Phase 1)
- No real sensor streaming; simulated readings only
- No notifications/email flows
- Simple stress rules (no ML)