import os
import sqlite3
from pathlib import Path
from contextlib import contextmanager
 
from app.auth_utils import hash_password, generate_salt 
 
_BACKEND_DIR = Path(__file__).resolve().parents[1]

DATABASE_PATH: str = os.environ.get(
    "DATABASE_URL", str(_BACKEND_DIR / "data" / "calmipet.db")
)
if DATABASE_PATH.startswith("sqlite:///"):
    DATABASE_PATH = DATABASE_PATH.replace("sqlite:///", "", 1)

@contextmanager 
def get_connection(): 
    """ 
    Yield a SQLite connection and guarantee it is closed even if the caller 
    raises.  Usage: 
        with get_connection() as conn: 
            ... 
    """ 
    db_path = Path(DATABASE_PATH)
    db_path.parent.mkdir(exist_ok=True, parents=True)
    conn = sqlite3.connect(str(db_path), check_same_thread=False)
    try: 
        yield conn 
    finally: 
        conn.close() 
 
 
def init_db() -> None: 
    with get_connection() as conn: 
        cursor = conn.cursor() 
 
        # ------------------------------------------------------------------ 
        # Core tables 
        # ------------------------------------------------------------------ 
        cursor.execute(""" 
            CREATE TABLE IF NOT EXISTS users ( 
                id       INTEGER PRIMARY KEY AUTOINCREMENT, 
                email    TEXT UNIQUE NOT NULL, 
                username TEXT NOT NULL, 
                password TEXT NOT NULL, 
                salt     TEXT NOT NULL, 
                is_admin INTEGER DEFAULT 0, 
                pet_type TEXT DEFAULT 'raccoon', 
                created_at TEXT DEFAULT CURRENT_TIMESTAMP 
            ) 
        """) 
 
        cursor.execute(""" 
            CREATE TABLE IF NOT EXISTS readings ( 
                id           INTEGER PRIMARY KEY AUTOINCREMENT, 
                user_id      INTEGER NOT NULL, 
                heart_rate   REAL, 
                stress_level REAL, 
                hrv          REAL, 
                timestamp    TEXT DEFAULT CURRENT_TIMESTAMP, 
                FOREIGN KEY (user_id) REFERENCES users(id) 
            ) 
        """) 
 
        cursor.execute(""" 
            CREATE TABLE IF NOT EXISTS breathing_sessions ( 
                id         INTEGER PRIMARY KEY AUTOINCREMENT, 
                user_id    INTEGER NOT NULL, 
                duration   INTEGER, 
                completed  INTEGER DEFAULT 0, 
                started_at TEXT DEFAULT CURRENT_TIMESTAMP, 
                FOREIGN KEY (user_id) REFERENCES users(id) 
            ) 
        """) 
 
        cursor.execute(""" 
            CREATE TABLE IF NOT EXISTS gamification ( 
                id                 INTEGER PRIMARY KEY AUTOINCREMENT, 
                user_id            INTEGER UNIQUE NOT NULL, 
                streak             INTEGER DEFAULT 0, 
                xp                 INTEGER DEFAULT 0, 
                last_session_date  TEXT, 
                sessions_today     INTEGER DEFAULT 0, 
                FOREIGN KEY (user_id) REFERENCES users(id) 
            ) 
        """) 
 
        # ------------------------------------------------------------------ 
        # Migrations — fetch PRAGMA only once per table (#7) 
        # ------------------------------------------------------------------ 
        users_cols = {
            col[1]
            for col in cursor.execute("PRAGMA table_info(users)").fetchall()
        }
        if "password" not in users_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN password TEXT DEFAULT ''")
        if "salt" not in users_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN salt TEXT DEFAULT ''")

        gamification_cols = { 
            col[1] 
            for col in cursor.execute("PRAGMA table_info(gamification)").fetchall() 
        } 
        if "last_session_date" not in gamification_cols: 
            cursor.execute( 
                "ALTER TABLE gamification ADD COLUMN last_session_date TEXT" 
            ) 
        if "sessions_today" not in gamification_cols: 
            cursor.execute( 
                "ALTER TABLE gamification ADD COLUMN sessions_today INTEGER DEFAULT 0" 
            ) 
 
        # ------------------------------------------------------------------ 
        # Optional demo seed — only when explicitly requested (#6) 
        # ------------------------------------------------------------------ 
        if os.environ.get("CALMIPET_SEED_DEMO", "").lower() in ("1", "true", "yes"): 
            _seed_demo_user(cursor) 
 
        conn.commit() 
 
 
def _seed_demo_user(cursor: sqlite3.Cursor) -> None: 
    """Insert a demo user only when running in a dev/demo environment.""" 
    try: 
        existing = cursor.execute( 
            "SELECT id FROM users WHERE email = ?", ("demo@example.com",) 
        ).fetchone() 
        if existing: 
            return  # Already seeded 
        salt = generate_salt() 
        # Password comes from the env var; default only for local dev. 
        demo_password = os.environ.get("CALMIPET_DEMO_PASSWORD", "demo_dev_only") 
        phash = hash_password(demo_password, salt) 
        cursor.execute( 
            "INSERT INTO users (email, username, password, salt) VALUES (?, ?, ?, ?)", 
            ("demo@example.com", "demo", phash, salt), 
        ) 
    except sqlite3.Error as exc: 
        # Log but don't silently swallow — callers will see this in logs (#2) 
        print(f"[WARN] Demo user seed failed: {exc}")