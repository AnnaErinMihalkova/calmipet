# Phase 2 Documentation

## Sprint Verification

- Backend (FastAPI) running at `http://localhost:8000` with SQLite (`data/calmipet.db`).
- Auth works: signup/login return expected status; tokens issued (uid:* format).
- Readings work: create/list scoped до автентикиран потребител.
- Pets, streaks и breathing sessions работят през `/api/*`.
- Тестовете минават: end-to-end (signup → login → create reading → list readings).
- Mobile/Web говорят към `http://localhost:8000/api`.

## How To Run

- Backend: `uvicorn app.main:app --host 0.0.0.0 --port 8000` в `backend/` (или `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`).
- Frontend Web: `REACT_APP_API_BASE_URL='http://localhost:8000/api'` и `npm start` в `frontend/`.
- Mobile (Expo): `EXPO_PUBLIC_API_BASE_URL='http://localhost:8000/api'` и `expo start` в `mobile-app/`.

## Key Files

- Backend app: `backend/app/main.py`, `backend/app/routers/sensor.py`, `backend/app/database.py`
- Auth utils: `backend/app/auth_utils.py`
- Web login component: `frontend/src/components/Login.tsx`
- Mobile auth context: `mobile-app/src/context/AuthContext.tsx`

## Remaining Issues

- SQLite schema evolves в `init_db()`; миграции не са нужни за dev, но production трябва strategy.
- На Windows, задължително спри сървъра преди промяна на DB schema.
- GitHub push може да изисква настройка на remote/credentials.
