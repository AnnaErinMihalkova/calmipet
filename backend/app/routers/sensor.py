from fastapi import APIRouter, Depends, Request, HTTPException
import os
from typing import List, Dict, Any
from app.database import get_connection
from app.models import DataPayload, AnalyzePayload
from app.auth_utils import parse_user_id_from_token
from datetime import datetime, timedelta, date

router = APIRouter()

def get_current_user_id(request: Request) -> int:
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    uid = parse_user_id_from_token(auth or "")
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return uid

def _too_soon(conn, uid: int) -> bool:
    if os.getenv("CALMIPET_SKIP_RATE_LIMIT") == "1":
        return False
    cur = conn.cursor()
    cur.execute("SELECT timestamp FROM sensor_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1", (uid,))
    row = cur.fetchone()
    if not row or not row[0]:
        return False
    try:
        last = datetime.fromisoformat(row[0])
    except:
        return False
    now = datetime.utcnow()
    return (now - last) < timedelta(minutes=10)

@router.post("/data")
def add_data(payload: DataPayload, uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    if _too_soon(conn, uid):
        conn.close()
        raise HTTPException(status_code=429, detail="Please wait 10 minutes between readings")
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level, user_id) VALUES (?, ?, ?, ?)",
        (payload.heart_rate, payload.spo2, payload.stress_level if payload.stress_level is not None else 0.0, uid)
    )
    conn.commit()
    conn.close()
    return {"message": "Data saved"}

@router.get("/data")
def get_data(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, spo2, stress_level, timestamp FROM sensor_data WHERE user_id = ? ORDER BY timestamp DESC", (uid,))
    rows = cursor.fetchall()
    conn.close()
    return rows

@router.post("/analyze")
def analyze(payload: AnalyzePayload, uid: int = Depends(get_current_user_id)) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT heart_rate FROM sensor_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 20", (uid,))
    hr_rows = cursor.fetchall()
    conn.close()
    history_hr: List[int] = [r[0] for r in hr_rows] if hr_rows else []
    baseline = sum(history_hr) / len(history_hr) if history_hr else 70.0
    delta = payload.heart_rate - baseline
    score = max(0.0, min(1.0, delta / 40.0))
    label = "low"
    if score >= 0.6:
        label = "high"
    elif score >= 0.3:
        label = "medium"
    return {
        "heart_rate": payload.heart_rate,
        "spo2": payload.spo2,
        "baseline_hr": round(baseline, 2),
        "score": round(score, 3),
        "label": label,
        "history_count": len(history_hr),
    }

@router.get("/readings/")
def list_readings(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, stress_level, timestamp FROM sensor_data WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50", (uid,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "heart_rate": r[1],
            "stress_level": r[2],
            "timestamp": r[3],
        }
        for r in rows
    ]

@router.get("/readings/{id}/")
def get_reading(id: int, uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, stress_level, timestamp, user_id FROM sensor_data WHERE id = ?", (id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    if row[4] != uid:
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": row[0],
        "heart_rate": row[1],
        "stress_level": row[2],
        "timestamp": row[3],
    }

@router.post("/readings/")
def create_reading(payload: Dict[str, Any], uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    if _too_soon(conn, uid):
        conn.close()
        raise HTTPException(status_code=429, detail="Please wait 10 minutes between readings")
    cursor = conn.cursor()
    hr = int(payload.get("heart_rate", 0))
    stress_val = payload.get("stress_level", None)
    stress = float(stress_val) if stress_val is not None else None
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level, user_id) VALUES (?, ?, ?, ?)",
        (hr, 98, stress if stress is not None else 0.0, uid)
    )
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT timestamp FROM sensor_data WHERE id = ?", (new_id,))
    ts_row = cursor.fetchone()
    conn.close()
    return {
        "message": "Data saved",
        "id": new_id,
        "heart_rate": hr,
        "stress_level": stress,
        "timestamp": ts_row[0] if ts_row else None,
    }

@router.post("/bracelet/readings/")
def create_reading_external(payload: Dict[str, Any], uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    if _too_soon(conn, uid):
        conn.close()
        raise HTTPException(status_code=429, detail="Please wait 10 minutes between readings")
    cursor = conn.cursor()
    hr = int(payload.get("hr", 0))
    hrv_val = payload.get("hrv", None)
    hrv = float(hrv_val) if hrv_val is not None else None
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level, user_id) VALUES (?, ?, ?, ?)",
        (hr, 98, hrv if hrv is not None else 0.0, uid)
    )
    new_id = cursor.lastrowid
    conn.commit()
    cursor.execute("SELECT timestamp FROM sensor_data WHERE id = ?", (new_id,))
    ts_row = cursor.fetchone()
    conn.close()
    return {
        "message": "Data saved",
        "id": new_id,
        "heart_rate": hr,
        "stress_level": hrv,
        "timestamp": ts_row[0] if ts_row else None,
    }

@router.get("/pets/mine/")
def get_pet(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT pet_animal, mood, level, xp FROM pets WHERE user_id = ?", (uid,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO pets (user_id) VALUES (?)", (uid,))
        conn.commit()
        cur.execute("SELECT pet_animal, mood, level, xp FROM pets WHERE user_id = ?", (uid,))
        row = cur.fetchone()
    conn.close()
    return {"pet_animal": row[0], "mood": row[1], "level": row[2], "xp": row[3]}

@router.post("/pets/mine/update/")
def update_pet(payload: Dict[str, Any], uid: int = Depends(get_current_user_id)):
    pet_animal = payload.get("pet_animal", None)
    mood = payload.get("mood", None)
    level = payload.get("level", None)
    xp_delta = payload.get("xp_delta", None)
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT pet_animal, mood, level, xp FROM pets WHERE user_id = ?", (uid,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO pets (user_id) VALUES (?)", (uid,))
        conn.commit()
    sets = []
    params = []
    if pet_animal is not None:
        sets.append("pet_animal = ?")
        params.append(str(pet_animal))
    if mood is not None:
        sets.append("mood = ?")
        params.append(str(mood))
    if level is not None:
        sets.append("level = ?")
        params.append(int(level))
    if xp_delta is not None:
        sets.append("xp = COALESCE(xp, 0) + ?")
        params.append(int(xp_delta))
    if sets:
        q = "UPDATE pets SET " + ", ".join(sets) + ", updated_at = CURRENT_TIMESTAMP WHERE user_id = ?"
        params.append(uid)
        cur.execute(q, tuple(params))
        conn.commit()
    cur.execute("SELECT pet_animal, mood, level, xp FROM pets WHERE user_id = ?", (uid,))
    row = cur.fetchone()
    conn.close()
    return {"pet_animal": row[0], "mood": row[1], "level": row[2], "xp": row[3]}

@router.get("/streaks/mine/")
def get_streak(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT current_streak, max_streak, level, badges, sessions_today, last_session_date FROM gamification WHERE user_id = ?", (uid,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO gamification (user_id, current_streak, max_streak, level, badges, sessions_today, last_session_date) VALUES (?, 0, 0, 1, '', 0, NULL)", (uid,))
        conn.commit()
        cur.execute("SELECT current_streak, max_streak, level, badges, sessions_today, last_session_date FROM gamification WHERE user_id = ?", (uid,))
        row = cur.fetchone()
    conn.close()
    return {
        "current_streak": row[0],
        "max_streak": row[1],
        "level": row[2],
        "badges": row[3],
        "sessions_today": row[4],
        "last_session_date": row[5]
    }

@router.post("/breathing-sessions/")
def create_breathing_session(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO breathing_sessions (duration_seconds, user_id) VALUES (60, ?)", (uid,))
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": session_id, "started_at": "now", "completed": False}

@router.post("/breathing-sessions/{id}/complete/")
def complete_breathing_session(id: int, uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE breathing_sessions SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?", (id, uid))
    conn.commit()
    cursor.execute("SELECT current_streak, max_streak, last_session_date, sessions_today FROM gamification WHERE user_id = ?", (uid,))
    row = cursor.fetchone()
    today = date.today().isoformat()
    if not row:
        cursor.execute("INSERT INTO gamification (user_id, current_streak, max_streak, level, badges, updated_at, last_session_date, sessions_today) VALUES (?, 1, 1, 1, '', CURRENT_TIMESTAMP, ?, 1)", (uid, today))
    else:
        current, maxs, last_date, sessions_today = row
        if last_date == today:
            sessions_today = (sessions_today or 0) + 1
            cursor.execute("UPDATE gamification SET sessions_today = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", (sessions_today, uid))
        else:
            current = (current or 0) + 1
            maxs = max(maxs or 0, current)
            cursor.execute("UPDATE gamification SET current_streak = ?, max_streak = ?, last_session_date = ?, sessions_today = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?", (current, maxs, today, uid))
    conn.close()
    return {"id": id, "completed": True}
    return {"id": id, "completed": True}

def _require_admin(conn, uid: int):
    cur = conn.cursor()
    cur.execute("SELECT is_admin FROM users WHERE id = ?", (uid,))
    row = cur.fetchone()
    if not row or (row[0] or 0) != 1:
        raise HTTPException(status_code=403, detail="Admin required")
    return True

@router.get("/admin/readings/")
def admin_list_readings(request: Request, limit: int = 100):
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    uid = parse_user_id_from_token(auth or "")
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    conn = get_connection()
    _require_admin(conn, uid)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT s.id, s.heart_rate, s.stress_level, s.timestamp, s.user_id, u.username, u.email
        FROM sensor_data s
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.timestamp DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "heart_rate": r[1],
            "stress_level": r[2],
            "timestamp": r[3],
            "user_id": r[4],
            "username": r[5],
            "email": r[6],
        }
        for r in rows
    ]

@router.get("/admin/users/")
def admin_list_users(request: Request, limit: int = 100):
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    uid = parse_user_id_from_token(auth or "")
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    conn = get_connection()
    _require_admin(conn, uid)
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email, date_joined, is_admin FROM users ORDER BY date_joined DESC LIMIT ?", (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [
        {
            "id": r[0],
            "username": r[1],
            "email": r[2],
            "date_joined": r[3],
            "is_admin": r[4],
        }
        for r in rows
    ]
