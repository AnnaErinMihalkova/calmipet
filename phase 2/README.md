# Phase 2 Documentation

## Sprint Verification

- Backend running at `http://localhost:4000` with SQLite (`server/.env: DATABASE_URL=file:./dev.db`).
- Prisma schema synced; models: `User`, `RefreshToken`, `Reading` with relations.
- Auth works: signup/login return expected status; JWT issued with access/refresh.
- Readings CRUD works: create and list scoped to authenticated user.
- Tests pass: end-to-end flow (signup → login → create reading → list readings).
- Mobile app authenticates against API; session persisted with AsyncStorage; AuthGuard blocks unauthenticated access.

## How To Run

- Backend: `npm run dev` in `server/`.
- Frontend Web: set `REACT_APP_API_BASE_URL='http://localhost:4000/api'`, then `npm start` in `frontend/`.
- Mobile (Expo): set `EXPO_PUBLIC_API_BASE_URL='http://localhost:4000/api'`, then `npm start` in `mobile/`.

## Key Files

- Server Prisma schema: `server/prisma/schema.prisma`.
- JWT utilities: `server/src/libs/jwt.ts`.
- Auth routes/controllers: `server/src/modules/auth/*`.
- Readings module: `server/src/modules/readings/*`.
- Web login component: `frontend/src/components/Login.tsx`.
- Mobile auth context: `mobile/src/context/AuthContext.tsx`.
- Mobile auth guard: `mobile/src/components/AuthGuard.tsx`.

## Remaining Issues

- Migrations: No migration files were created; schema was applied via `prisma db push`. Create migration history with `npx prisma migrate dev --name init` (reset dev DB if prompted).
- Prisma EPERM rename warnings on Windows when dev server is running; stop the server before `prisma generate/push/migrate` to avoid file locks.
- GitHub push may require credentials or remote setup; ensure `git remote` is configured and authentication is available.