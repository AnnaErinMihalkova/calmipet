import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterable, Sequence

from app.auth_utils import hash_password, generate_salt

_BACKEND_DIR = Path(__file__).resolve().parents[1]


def get_database_url() -> str:
    """Read on each call so tests and runtime can override DATABASE_URL."""
    return os.environ.get("DATABASE_URL", str(_BACKEND_DIR / "data" / "calmipet.db"))


def is_postgres() -> bool:
    url = get_database_url()
    return url.startswith("postgresql://") or url.startswith("postgres://")


def _sqlite_path() -> str:
    path = get_database_url()
    if path.startswith("sqlite:///"):
        path = path.replace("sqlite:///", "", 1)
    return path


def adapt_sql(sql: str) -> str:
    """SQLite uses ? placeholders; PostgreSQL uses %s."""
    if is_postgres():
        return sql.replace("?", "%s")
    return sql


@contextmanager
def get_connection():
    if is_postgres():
        import psycopg2

        conn = psycopg2.connect(get_database_url())
        try:
            yield conn
        finally:
            conn.close()
    else:
        db_path = Path(_sqlite_path())
        db_path.parent.mkdir(exist_ok=True, parents=True)
        conn = sqlite3.connect(str(db_path), check_same_thread=False)
        try:
            yield conn
        finally:
            conn.close()


def execute(conn, sql: str, params: Sequence[Any] | None = None):
    cur = conn.cursor()
    cur.execute(adapt_sql(sql), params or ())
    return cur


def fetchone(conn, sql: str, params: Sequence[Any] | None = None):
    cur = execute(conn, sql, params)
    return cur.fetchone()


def fetchall(conn, sql: str, params: Sequence[Any] | None = None):
    cur = execute(conn, sql, params)
    return cur.fetchall()


def insert_returning_id(conn, sql: str, params: Sequence[Any]) -> int:
    if is_postgres():
        cur = execute(conn, sql + " RETURNING id", params)
        row = cur.fetchone()
        if not row:
            raise RuntimeError("INSERT did not return id")
        return int(row[0])
    cur = execute(conn, sql, params)
    return int(cur.lastrowid)


def _init_postgres(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL DEFAULT '',
            salt TEXT NOT NULL DEFAULT '',
            password_hash TEXT,
            password_salt TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            pet_type TEXT DEFAULT 'raccoon',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS readings (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            heart_rate DOUBLE PRECISION,
            stress_level DOUBLE PRECISION,
            hrv DOUBLE PRECISION,
            timestamp TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS breathing_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            duration INTEGER,
            completed BOOLEAN DEFAULT FALSE,
            started_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS gamification (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            streak INTEGER DEFAULT 0,
            xp INTEGER DEFAULT 0,
            last_session_date TEXT,
            sessions_today INTEGER DEFAULT 0
        )
        """
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_readings_user_id ON readings(user_id)"
    )
    cursor.execute(
        "CREATE INDEX IF NOT EXISTS idx_breathing_sessions_user_id ON breathing_sessions(user_id)"
    )


def _init_sqlite(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            salt TEXT NOT NULL,
            is_admin INTEGER DEFAULT 0,
            pet_type TEXT DEFAULT 'raccoon',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS readings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            heart_rate REAL,
            stress_level REAL,
            hrv REAL,
            timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS breathing_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            duration INTEGER,
            completed INTEGER DEFAULT 0,
            started_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS gamification (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            streak INTEGER DEFAULT 0,
            xp INTEGER DEFAULT 0,
            last_session_date TEXT,
            sessions_today INTEGER DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
        """
    )

    users_cols = {col[1] for col in cursor.execute("PRAGMA table_info(users)").fetchall()}
    if "password" not in users_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''")
    if "salt" not in users_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT DEFAULT ''")
    if "password_hash" not in users_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "password_salt" not in users_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN password_salt TEXT")

    gamification_cols = {
        col[1] for col in cursor.execute("PRAGMA table_info(gamification)").fetchall()
    }
    if "last_session_date" not in gamification_cols:
        cursor.execute("ALTER TABLE gamification ADD COLUMN last_session_date TEXT")
    if "sessions_today" not in gamification_cols:
        cursor.execute(
            "ALTER TABLE gamification ADD COLUMN sessions_today INTEGER DEFAULT 0"
        )

def _repair_empty_password_columns(cursor) -> None:
    """Copy legacy hash columns into password/salt when a migration left them empty."""
    cursor.execute(
        adapt_sql(
            """
            UPDATE users
            SET password = password_hash, salt = password_salt
            WHERE (password IS NULL OR password = '')
              AND password_hash IS NOT NULL AND password_hash != ''
              AND password_salt IS NOT NULL AND password_salt != ''
            """
        )
    )


def init_db() -> None:
    with get_connection() as conn:
        cursor = conn.cursor()
        if is_postgres():
            _init_postgres(cursor)
        else:
            _init_sqlite(cursor)
        _repair_empty_password_columns(cursor)

        if os.environ.get("CALMIPET_SEED_DEMO", "").lower() in ("1", "true", "yes"):
            _seed_demo_user(cursor)

        conn.commit()


def _seed_demo_user(cursor) -> None:
    try:
        existing = cursor.execute(
            adapt_sql("SELECT id FROM users WHERE email = ?"),
            ("demo@example.com",),
        ).fetchone()
        if existing:
            return
        salt = generate_salt()
        demo_password = os.environ.get("CALMIPET_DEMO_PASSWORD", "demo_dev_only")
        phash = hash_password(demo_password, salt)
        if is_postgres():
            cursor.execute(
                adapt_sql(
                    """
                    INSERT INTO users (email, username, password, salt, password_hash, password_salt)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """
                ),
                ("demo@example.com", "demo", phash, salt, phash, salt),
            )
        else:
            cursor.execute(
                adapt_sql(
                    "INSERT INTO users (email, username, password, salt) VALUES (?, ?, ?, ?)"
                ),
                ("demo@example.com", "demo", phash, salt),
            )
    except Exception as exc:
        print(f"[WARN] Demo user seed failed: {exc}")
