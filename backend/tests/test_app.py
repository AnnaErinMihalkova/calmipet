import os
from pathlib import Path
import unittest

from fastapi.testclient import TestClient

from app import database
from app.main import app


class BackendTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        test_db = Path("data/test.db")
        test_db.parent.mkdir(exist_ok=True)
        database.DB_PATH = test_db
        database.init_db()
        cls.client = TestClient(app)
        # Create test user
        r = cls.client.post("/api/auth/signup/", json={"email": "demo@example.com", "username": "demo", "password": "pass1234"})
        if r.status_code != 200 or not r.json().get("accessToken"):
            r_login = cls.client.post("/api/auth/login/", json={"email": "demo@example.com", "password": "pass1234"})
            cls.token = r_login.json().get("accessToken")
        else:
            cls.token = r.json().get("accessToken")

    def test_root(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json().get("status"), "CalmiPet backend running")

    def test_auth_me(self):
        r = self.client.get("/api/auth/me/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("username", data)
        self.assertIn("email", data)

    def test_data_flow_and_analyze(self):
        r = self.client.post("/data", json={"heart_rate": 80, "spo2": 98, "stress_level": 0.2})
        self.assertEqual(r.status_code, 200)
        self.assertIn("message", r.json())

        r = self.client.get("/data")
        self.assertEqual(r.status_code, 200)
        rows = r.json()
        self.assertTrue(len(rows) >= 1)

        r = self.client.post("/analyze", json={"heart_rate": 85})
        self.assertEqual(r.status_code, 200)
        payload = r.json()
        self.assertIn("score", payload)
        self.assertIn("label", payload)
        self.assertIn("baseline_hr", payload)

    def test_readings_endpoints(self):
        r = self.client.post("/readings/", json={"heart_rate": 72, "stress_level": 30.0})
        self.assertEqual(r.status_code, 200)
        self.assertIn("message", r.json())

        r = self.client.get("/readings/")
        self.assertEqual(r.status_code, 200)
        items = r.json()
        self.assertIsInstance(items, list)
        if items:
            rid = items[0].get("id")
            r2 = self.client.get(f"/readings/{rid}/")
            self.assertEqual(r2.status_code, 200)
            self.assertIn("heart_rate", r2.json())

    def test_breathing_sessions(self):
        r = self.client.post("/breathing-sessions/")
        self.assertEqual(r.status_code, 200)
        sid = r.json().get("id")
        self.assertIsNotNone(sid)
        r = self.client.post(f"/breathing-sessions/{sid}/complete/")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("completed"))

    def test_streaks_mine(self):
        r = self.client.get("/streaks/mine/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("current_streak", data)
        self.assertIn("max_streak", data)


if __name__ == "__main__":
    unittest.main()
