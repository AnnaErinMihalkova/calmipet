import os
from pathlib import Path
import unittest

from fastapi.testclient import TestClient

from app import database
from app.main import app


class BackendTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["CALMIPET_SKIP_RATE_LIMIT"] = "1"
        test_db = Path("data/test.db")
        test_db.parent.mkdir(exist_ok=True)
        database.DB_PATH = test_db
        database.init_db()
        cls.client = TestClient(app)
        r = cls.client.post("/api/auth/signup/", json={"email": "demo@example.com", "username": "demo", "password": "pass1234"})
        if r.status_code != 200 or not r.json().get("accessToken"):
            r_login = cls.client.post("/api/auth/login/", json={"email": "demo@example.com", "password": "pass1234"})
            cls.token = r_login.json().get("accessToken")
        else:
            cls.token = r.json().get("accessToken")
        r2 = cls.client.post("/api/auth/signup/", json={"email": "other@example.com", "username": "other", "password": "pass1234"})
        if r2.status_code != 200 or not r2.json().get("accessToken"):
            r2_login = cls.client.post("/api/auth/login/", json={"email": "other@example.com", "password": "pass1234"})
            cls.token2 = r2_login.json().get("accessToken")
        else:
            cls.token2 = r2.json().get("accessToken")

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
        r = self.client.post("/readings/", json={"heart_rate": 72, "stress_level": 30.0}, headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        self.assertIn("message", r.json())

        r = self.client.get("/readings/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        items = r.json()
        self.assertIsInstance(items, list)
        if items:
            rid = items[0].get("id")
            r2 = self.client.get(f"/readings/{rid}/", headers={"Authorization": f"Bearer {self.token}"})
            self.assertEqual(r2.status_code, 200)
            self.assertIn("heart_rate", r2.json())

    def test_readings_require_auth(self):
        r = self.client.post("/readings/", json={"heart_rate": 70, "stress_level": 10.0})
        self.assertEqual(r.status_code, 401)
        r = self.client.get("/readings/")
        self.assertEqual(r.status_code, 401)

    def test_multi_user_readings_isolated(self):
        r1 = self.client.post("/readings/", json={"heart_rate": 177, "stress_level": 1.0}, headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r1.status_code, 200)
        r2 = self.client.post("/readings/", json={"heart_rate": 278, "stress_level": 2.0}, headers={"Authorization": f"Bearer {self.token2}"})
        self.assertEqual(r2.status_code, 200)
        list1 = self.client.get("/readings/", headers={"Authorization": f"Bearer {self.token}"}).json()
        list2 = self.client.get("/readings/", headers={"Authorization": f"Bearer {self.token2}"}).json()
        hr1 = [item.get("heart_rate") for item in list1]
        hr2 = [item.get("heart_rate") for item in list2]
        self.assertIn(177, hr1)
        self.assertNotIn(177, hr2)
        self.assertIn(278, hr2)
        self.assertNotIn(278, hr1)

    def test_breathing_sessions(self):
        r = self.client.post("/breathing-sessions/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        sid = r.json().get("id")
        self.assertIsNotNone(sid)
        r = self.client.post(f"/breathing-sessions/{sid}/complete/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("completed"))

    def test_streaks_mine(self):
        r = self.client.get("/streaks/mine/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("current_streak", data)
        self.assertIn("max_streak", data)

    def test_pets_per_user(self):
        r = self.client.get("/pets/mine/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("pet_animal", data)
        r2 = self.client.post("/pets/mine/update/", json={"pet_animal": "fox", "xp_delta": 10}, headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r2.status_code, 200)
        updated = r2.json()
        self.assertEqual(updated.get("pet_animal"), "fox")

    def test_admin_endpoints_require_admin(self):
        r = self.client.get("/api/admin/users/", headers={"Authorization": f"Bearer {self.token2}"})
        self.assertEqual(r.status_code, 403)
        r = self.client.get("/api/admin/readings/", headers={"Authorization": f"Bearer {self.token2}"})
        self.assertEqual(r.status_code, 403)

    def test_admin_endpoints_work_for_admin(self):
        r_promote = self.client.post("/api/auth/promote/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r_promote.status_code, 200)
        self.client.post("/readings/", json={"heart_rate": 190, "stress_level": 3.0}, headers={"Authorization": f"Bearer {self.token}"})
        r_users = self.client.get("/api/admin/users/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r_users.status_code, 200)
        users = r_users.json()
        self.assertTrue(any(u.get("is_admin") == 1 for u in users))
        r_readings = self.client.get("/api/admin/readings/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r_readings.status_code, 200)
        readings = r_readings.json()
        self.assertIsInstance(readings, list)


if __name__ == "__main__":
    unittest.main()
