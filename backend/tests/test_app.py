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
        if test_db.exists():
            test_db.unlink()
        os.environ["DATABASE_URL"] = f"sqlite:///{test_db.resolve()}"
        database.init_db()
        cls.client = TestClient(app)
        
        # Register user 1
        r = cls.client.post("/api/auth/register/", json={"email": "test1@example.com", "username": "test1", "password": "pass1234"})
        if r.status_code == 200:
            cls.token = r.json().get("token")
        else:
            r_login = cls.client.post("/api/auth/login/", json={"email": "test1@example.com", "password": "pass1234"})
            cls.token = r_login.json().get("token")

        # Register user 2
        r2 = cls.client.post("/api/auth/register/", json={"email": "test2@example.com", "username": "test2", "password": "pass1234"})
        if r2.status_code == 200:
            cls.token2 = r2.json().get("token")
        else:
            r2_login = cls.client.post("/api/auth/login/", json={"email": "test2@example.com", "password": "pass1234"})
            cls.token2 = r2_login.json().get("token")

    def test_auth_me(self):
        r = self.client.get("/api/auth/me/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("username", data)
        self.assertIn("email", data)
        self.assertFalse(data.get("is_admin"))

    def test_auth_promote_removed(self):
        # Risk 2 mitigation check
        r = self.client.post("/api/auth/promote/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 404)

    def test_unauthenticated_endpoints_blocked(self):
        # Risk 5 mitigation check
        r = self.client.post("/api/data", json={"heart_rate": 80, "stress_level": 0.2})
        self.assertEqual(r.status_code, 401)

        r = self.client.get("/api/data")
        self.assertEqual(r.status_code, 401)

        r = self.client.post("/api/analyze", json={"heart_rate": 85})
        self.assertEqual(r.status_code, 401)

    def test_data_flow_authenticated(self):
        r = self.client.post("/api/data", json={"heart_rate": 80, "stress_level": 0.2}, headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json().get("status"), "ok")

        r = self.client.get("/api/data", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        rows = r.json()
        self.assertTrue(len(rows) >= 1)
        self.assertIn("heart_rate", rows[0])

    def test_analyze_endpoint(self):
        r = self.client.post("/api/analyze", json={"heart_rate": 85, "hrv": 20}, headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        payload = r.json()
        self.assertEqual(payload.get("stress_label"), "stressed")

    def test_breathing_sessions(self):
        r = self.client.post("/api/breathing/start", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        sid = r.json().get("id")
        self.assertIsNotNone(sid)
        
        r = self.client.post(f"/api/breathing/{sid}/complete", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json().get("completed"))

    def test_streaks(self):
        r = self.client.get("/api/breathing/streak", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertIn("streak", data)
        self.assertIn("xp", data)

    def test_update_pet(self):
        r = self.client.patch("/api/users/pet/?pet_type=fox", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data.get("pet_type"), "fox")
        
        r_me = self.client.get("/api/auth/me/", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r_me.json().get("pet_type"), "fox")

    def test_update_pet_invalid(self):
        r = self.client.patch("/api/users/pet/?pet_type=dragon", headers={"Authorization": f"Bearer {self.token}"})
        self.assertEqual(r.status_code, 400)


if __name__ == "__main__":
    unittest.main()
