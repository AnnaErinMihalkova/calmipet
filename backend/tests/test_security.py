import os
import unittest
import jwt
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from pathlib import Path

from app import database
from app.main import app
from app.auth_utils import JWT_SECRET, JWT_ALGORITHM

class SecurityTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["CALMIPET_SKIP_RATE_LIMIT"] = "1"
        test_db = Path("data/test_sec.db")
        test_db.parent.mkdir(exist_ok=True)
        database.DATABASE_PATH = str(test_db)
        database.init_db()
        cls.client = TestClient(app)
        
        # Register a test user
        r = cls.client.post("/api/auth/register/", json={"email": "sec@example.com", "username": "sec", "password": "pass1234"})
        if r.status_code == 200:
            cls.token = r.json().get("token")
            cls.user_id = r.json().get("user_id")
        else:
            r_login = cls.client.post("/api/auth/login/", json={"email": "sec@example.com", "password": "pass1234"})
            cls.token = r_login.json().get("token")
            cls.user_id = r_login.json().get("user_id")

    def test_risk1_jwt_forgeability(self):
        """Test Risk 1: Tokens must be properly signed JWTs, not forgeable strings"""
        # Try the old forgeable format
        r = self.client.get("/api/auth/me/", headers={"Authorization": f"Bearer uid:{self.user_id}"})
        self.assertEqual(r.status_code, 401)
        
        # Try a JWT signed with the wrong secret
        fake_token = jwt.encode(
            {"sub": str(self.user_id), "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            "wrong_secret_key",
            algorithm=JWT_ALGORITHM
        )
        r = self.client.get("/api/auth/me/", headers={"Authorization": f"Bearer {fake_token}"})
        self.assertEqual(r.status_code, 401)

    def test_risk1_jwt_expiry(self):
        """Test Risk 1: Tokens must expire"""
        # Create an expired token
        expired_token = jwt.encode(
            {"sub": str(self.user_id), "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
            JWT_SECRET,
            algorithm=JWT_ALGORITHM
        )
        r = self.client.get("/api/auth/me/", headers={"Authorization": f"Bearer {expired_token}"})
        self.assertEqual(r.status_code, 401)

    def test_risk3_cors_no_wildcard(self):
        """Test Risk 3: CORS should not allow * with credentials"""
        # We can test this by sending an Origin header and checking Access-Control-Allow-Origin
        # The backend should echo back the allowed origin if it's in the list, but not '*'
        r = self.client.options(
            "/api/auth/me/",
            headers={
                "Origin": "http://malicious.com",
                "Access-Control-Request-Method": "GET"
            }
        )
        # It should either omit the ACAO header or set it to something other than '*' or 'http://malicious.com'
        allowed_origin = r.headers.get("access-control-allow-origin")
        self.assertNotIn(allowed_origin, ["*", "http://malicious.com"])

    def test_risk4_demo_user_gated(self):
        """Test Risk 4: Demo user should not be seeded by default in a new DB"""
        # Attempt to login with demo credentials
        r = self.client.post("/api/auth/login/", json={"email": "demo@example.com", "password": "demo_dev_only"})
        # Should be invalid credentials because the demo user was not seeded
        self.assertEqual(r.status_code, 401)

    def test_risk6_bare_except(self):
        """Test Risk 6: Bare except replaced, token parser should handle malformed data gracefully"""
        r = self.client.get("/api/auth/me/", headers={"Authorization": "Bearer not.a.real.jwt"})
        self.assertEqual(r.status_code, 401)

        r = self.client.get("/api/auth/me/", headers={"Authorization": "Bearer "})
        self.assertEqual(r.status_code, 401)

if __name__ == "__main__":
    unittest.main()
