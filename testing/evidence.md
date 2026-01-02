# Testing Evidence

- Mobile Features
  - Export: screenshot placeholder at ./mobile-export.png
  - Delete All Data: screenshot placeholder at ./mobile-delete.png
  - How to capture:
    - Run `npm run ios` or `npm run android` in /mobile
    - Navigate to HomeScreen
    - Tap "Export Data (CSV)" and confirm; take screenshot
    - Tap "Delete All Data" and confirm; take screenshot
    - Save images as `mobile-export.png` and `mobile-delete.png` in this folder

- Backend Logs
  - Export endpoint logs: see ./export_endpoint.log
  - Delete-all endpoint logs: see ./backend_tests.log (PrivacyTests)

- Test Output
  - Full backend test run: ./backend_tests.log
  - ML experiment run: ./ml_experiment.log

