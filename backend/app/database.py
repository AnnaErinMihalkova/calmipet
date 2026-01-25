import sqlite3
from pathlib import Path

DB_PATH = Path("data/calmipet.db")

def get_connection():
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sensor_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        heart_rate INTEGER,
        spo2 INTEGER,
        stress_level REAL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    info = cursor.execute("PRAGMA table_info(sensor_data)").fetchall()
    if not any(col[1] == "user_id" for col in info):
        cursor.execute("ALTER TABLE sensor_data ADD COLUMN user_id INTEGER")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS breathing_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        duration_seconds INTEGER,
        completed BOOLEAN DEFAULT 0
    )
    """)
    info_bs = cursor.execute("PRAGMA table_info(breathing_sessions)").fetchall()
    if not any(col[1] == "user_id" for col in info_bs):
        cursor.execute("ALTER TABLE breathing_sessions ADD COLUMN user_id INTEGER")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        date_joined DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    info_users = cursor.execute("PRAGMA table_info(users)").fetchall()
    if not any(col[1] == "is_admin" for col in info_users):
        cursor.execute("ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0")
    # Seed demo user for easier login during development
    try:
        cur2 = conn.cursor()
        cur2.execute("SELECT id FROM users WHERE email = ?", ("demo@example.com",))
        row = cur2.fetchone()
        if not row:
            from app.auth_utils import gen_salt, hash_password  # local import to avoid circular deps
            salt = gen_salt()
            phash = hash_password("pass1234", salt)
            cur2.execute(
                "INSERT INTO users (email, username, password_salt, password_hash) VALUES (?, ?, ?, ?)",
                ("demo@example.com", "demo", salt, phash)
            )
            conn.commit()
    except Exception:
        pass
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS gamification (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        current_streak INTEGER DEFAULT 0,
        max_streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        badges TEXT DEFAULT '',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    info_g = cursor.execute("PRAGMA table_info(gamification)").fetchall()
    if not any(col[1] == "last_session_date" for col in info_g):
        cursor.execute("ALTER TABLE gamification ADD COLUMN last_session_date TEXT")
    info_g = cursor.execute("PRAGMA table_info(gamification)").fetchall()
    if not any(col[1] == "sessions_today" for col in info_g):
        cursor.execute("ALTER TABLE gamification ADD COLUMN sessions_today INTEGER DEFAULT 0")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE NOT NULL,
        pet_animal TEXT DEFAULT 'raccoon',
        mood TEXT DEFAULT 'calm',
        level INTEGER DEFAULT 1,
        xp INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()
    conn.close()
