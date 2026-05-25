import os
import sqlite3
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

from app import database
from app.auth_utils import generate_salt_legacy, hash_password_legacy
from app.main import app


class LegacyAuthTestCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        os.environ["CALMIPET_SKIP_RATE_LIMIT"] = "1"
        test_db = Path("data/test_legacy.db")
        test_db.parent.mkdir(exist_ok=True)
        if test_db.exists():
            test_db.unlink()
        os.environ["DATABASE_URL"] = f"sqlite:///{test_db.resolve()}"
        database.init_db()

        salt = generate_salt_legacy()
        phash = hash_password_legacy("legacy-pass", salt)
        conn = sqlite3.connect(str(test_db))
        conn.execute(
            """
            INSERT INTO users (email, username, password_hash, password_salt, password, salt)
            VALUES (?, ?, ?, ?, '', '')
            """,
            ("legacy@example.com", "legacy", phash, salt),
        )
        conn.commit()
        conn.close()
        database.init_db()

        cls.client = TestClient(app)

    def test_legacy_login_and_upgrade(self):
        r = self.client.post(
            "/api/auth/login/",
            json={"email": "legacy@example.com", "password": "legacy-pass"},
        )
        self.assertEqual(r.status_code, 200, r.text)
        self.assertIn("token", r.json())

        db_path = os.environ["DATABASE_URL"].replace("sqlite:///", "")
        conn = sqlite3.connect(db_path)
        row = conn.execute(
            "SELECT password_hash, password_salt, password, salt FROM users WHERE email = ?",
            ("legacy@example.com",),
        ).fetchone()
        conn.close()
        stored_hash, stored_salt, password, salt = row
        self.assertEqual(len(stored_hash), 64)
        self.assertEqual(len(stored_salt), 32)
        self.assertEqual(stored_hash, password)
        self.assertEqual(stored_salt, salt)
