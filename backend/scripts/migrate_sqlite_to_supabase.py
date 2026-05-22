#!/usr/bin/env python3
"""
Copy data from a local SQLite calmipet.db into Supabase (PostgreSQL).

Usage (from backend/):
  set SQLITE_PATH=data/calmipet.db
  set DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
  python scripts/migrate_sqlite_to_supabase.py
"""
from __future__ import annotations

import os
import sqlite3
import sys
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_batch

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import init_db  # noqa: E402


def main() -> None:
    sqlite_path = os.environ.get("SQLITE_PATH", str(BACKEND_DIR / "data" / "calmipet.db"))
    pg_url = os.environ.get("DATABASE_URL", "")
    if not pg_url.startswith(("postgresql://", "postgres://")):
        print("Set DATABASE_URL to your Supabase PostgreSQL connection string.")
        sys.exit(1)

    if not Path(sqlite_path).exists():
        print(f"SQLite file not found: {sqlite_path}")
        sys.exit(1)

    print("Creating PostgreSQL schema...")
    init_db()

    src = sqlite3.connect(sqlite_path)
    src.row_factory = sqlite3.Row
    dst = psycopg2.connect(pg_url)
    dst.autocommit = False

    try:
        with dst.cursor() as cur:
            cur.execute(
                "TRUNCATE users, readings, breathing_sessions, gamification RESTART IDENTITY CASCADE"
            )

            users = src.execute("SELECT * FROM users ORDER BY id").fetchall()
            user_id_map: dict[int, int] = {}

            for u in users:
                keys = u.keys()
                password = u["password"] if "password" in keys else ""
                salt = u["salt"] if "salt" in keys else ""
                ph = u["password_hash"] if "password_hash" in keys else password
                ps = u["password_salt"] if "password_salt" in keys else salt
                cur.execute(
                    """
                    INSERT INTO users (email, username, password, salt, password_hash, password_salt, is_admin, pet_type, created_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                    """,
                    (
                        u["email"],
                        u["username"],
                        password or ph,
                        salt or ps,
                        ph,
                        ps,
                        bool(u["is_admin"]) if "is_admin" in keys else False,
                        u["pet_type"] if "pet_type" in keys else "raccoon",
                        u["created_at"] if "created_at" in keys else None,
                    ),
                )
                new_id = cur.fetchone()[0]
                user_id_map[int(u["id"])] = new_id

            readings = src.execute("SELECT * FROM readings ORDER BY id").fetchall()
            reading_rows = []
            for r in readings:
                reading_rows.append(
                    (
                        user_id_map[int(r["user_id"])],
                        r["heart_rate"],
                        r["stress_level"],
                        r["hrv"] if "hrv" in r.keys() else None,
                        r["timestamp"],
                    )
                )
            if reading_rows:
                execute_batch(
                    cur,
                    """
                    INSERT INTO readings (user_id, heart_rate, stress_level, hrv, timestamp)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    reading_rows,
                )

            sessions = src.execute(
                "SELECT * FROM breathing_sessions ORDER BY id"
            ).fetchall()
            session_rows = []
            for s in sessions:
                session_rows.append(
                    (
                        user_id_map[int(s["user_id"])],
                        s["duration"],
                        bool(s["completed"]),
                        s["started_at"],
                    )
                )
            if session_rows:
                execute_batch(
                    cur,
                    """
                    INSERT INTO breathing_sessions (user_id, duration, completed, started_at)
                    VALUES (%s, %s, %s, %s)
                    """,
                    session_rows,
                )

            gam = src.execute("SELECT * FROM gamification ORDER BY id").fetchall()
            gam_rows = []
            for g in gam:
                gam_rows.append(
                    (
                        user_id_map[int(g["user_id"])],
                        g["streak"],
                        g["xp"],
                        g["last_session_date"] if "last_session_date" in g.keys() else None,
                        g["sessions_today"] if "sessions_today" in g.keys() else 0,
                    )
                )
            if gam_rows:
                execute_batch(
                    cur,
                    """
                    INSERT INTO gamification (user_id, streak, xp, last_session_date, sessions_today)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    gam_rows,
                )

        dst.commit()
        print(
            f"Migrated {len(users)} users, {len(readings)} readings, "
            f"{len(sessions)} sessions, {len(gam)} gamification rows."
        )
    except Exception:
        dst.rollback()
        raise
    finally:
        src.close()
        dst.close()


if __name__ == "__main__":
    main()
