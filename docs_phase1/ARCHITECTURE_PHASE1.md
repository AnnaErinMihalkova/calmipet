# CalmiPet — Phase 1 Architecture

## Diagram (Text)
```
[ Simulated Bracelet ]
      | JSON POST (optional later)
      v
[ React App @ localhost:3001 ] -- axios --> [ Django REST @ 127.0.0.1:8000 ] -- ORM --> [ SQLite DB ]
            |                                               ^
            |                                               |
            +-- UI Logic (rules) --------------> Rule-based stress checks
```

## Components
- Simulated bracelet: data generator (client-triggered via “Add Test Reading”)
- Mobile/Web app: React + TS, session auth, charts, pet UI
- Django backend: auth endpoints, readings endpoints
- Database: SQLite models for users and readings
- Logic: Rule-based stress detection (thresholds on BPM/HRV)

## Data Flow
1. User signs up/logs in → session cookie set (SameSite=Lax)
2. Dashboard loads → GET `/api/readings/` to show recent data
3. User clicks “Add Test Reading” → frontend generates a payload and POSTs `/api/readings/`
4. Backend validates and stores → returns created object
5. UI updates lists and trends → rule-based logic sets pet to “worried” or “calm”
6. User starts breathing → after completion, streak increments and pet calms