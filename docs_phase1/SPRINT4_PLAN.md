# Sprint 4 Implementation Plan

## Goals
1. Run and document an ML experiment (success or failure is acceptable)
2. Add data export and privacy controls
3. Implement minimal backend security
4. Complete backend and mobile testing with evidence

## Architecture Principles
- Clean architecture
- Readable code
- Clear documentation
- Minimal, testable solutions
- No over-engineering

---

## 1. ML Experiment: Stress Prediction Model

### Objective
Create a simple machine learning model to predict stress levels based on HR/HRV patterns.

### Approach
- Use scikit-learn for a simple classification model
- Train on existing stress events and readings data
- Document results (even if model doesn't perform well)

### Implementation
- Location: `backend/api/ml/`
- Files:
  - `stress_predictor.py` - Model training and prediction
  - `experiment_results.md` - Documentation of experiment

### Success Criteria
- Model trains successfully
- Results documented (accuracy, confusion matrix, etc.)
- API endpoint to get predictions (optional)

---

## 2. Data Export and Privacy Controls

### Data Export
- **CSV Export**: `/api/readings/export/csv/`
- **JSON Export**: `/api/readings/export/json/`
- Include all user readings with timestamps

### Privacy Controls
- **Privacy Settings Model**: Store user preferences
  - Data sharing preferences
  - Analytics opt-in/out
- **Data Deletion**: `/api/auth/delete-account/` (GDPR compliance)
  - Delete all user data
  - Cascade delete readings, events, etc.

### Implementation
- Location: `backend/api/models.py` (PrivacySettings)
- Location: `backend/api/views.py` (export endpoints)

---

## 3. Backend Security

### Rate Limiting
- Add django-ratelimit or custom middleware
- Limit: 100 requests/hour per IP for auth endpoints
- Limit: 1000 requests/hour per user for API endpoints

### Security Headers
- Add security middleware
- Headers:
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - Content-Security-Policy (basic)

### Input Validation
- Enhance existing serializers
- Add field-level validation
- Sanitize user inputs

### Implementation
- Location: `backend/backend/middlewares/`
- Location: `backend/backend/settings.py`

---

## 4. Testing

### Backend Testing (Django)
- Expand `backend/api/tests.py`
- Add tests for:
  - Data export endpoints
  - Privacy controls
  - Security features
  - ML prediction endpoint

### Backend Testing (Node.js)
- Expand `server/tests/`
- Add tests for:
  - Pagination
  - Error handling
  - Security middleware

### Mobile Testing
- Create `mobile/src/__tests__/`
- Test:
  - API integration
  - Component rendering
  - Navigation flows

### Test Evidence
- Generate test coverage reports
- Document test results in `SPRINT4_TEST_RESULTS.md`

---

## File Structure

```
backend/
  api/
    ml/
      stress_predictor.py
      experiment_results.md
    models.py (add PrivacySettings)
    views.py (add export endpoints)
  backend/
    middlewares/
      rate_limit.py
      security.py
    settings.py (add security config)

server/
  src/
    middlewares/
      rate_limit.ts
      security.ts

mobile/
  src/
    __tests__/
      api.test.ts
      components.test.tsx

docs_phase1/
  SPRINT4_PLAN.md (this file)
  SPRINT4_TEST_RESULTS.md
```

---

## Success Metrics

1. ✅ ML experiment documented (regardless of performance)
2. ✅ CSV and JSON export working
3. ✅ Privacy settings and data deletion implemented
4. ✅ Rate limiting and security headers active
5. ✅ Test coverage > 70% for critical paths
6. ✅ Test results documented

---

## Timeline Estimate

- ML Experiment: 2-3 hours
- Data Export: 1-2 hours
- Privacy Controls: 2-3 hours
- Security: 2-3 hours
- Testing: 3-4 hours
- Documentation: 1-2 hours

**Total: ~12-17 hours**

