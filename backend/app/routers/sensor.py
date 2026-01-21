from fastapi import APIRouter, Depends, Request, HTTPException
from typing import List, Dict, Any
from app.database import get_connection
from app.models import DataPayload, AnalyzePayload
from app.auth_utils import parse_user_id_from_token

router = APIRouter()

@router.post("/data")
def add_data(payload: DataPayload):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level) VALUES (?, ?, ?)",
        (payload.heart_rate, payload.spo2, payload.stress_level if payload.stress_level is not None else 0.0)
    )
    conn.commit()
    conn.close()
    return {"message": "Data saved"}

@router.get("/data")
def get_data():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM sensor_data ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    return rows

@router.post("/analyze")
def analyze(payload: AnalyzePayload) -> Dict[str, Any]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT heart_rate FROM sensor_data ORDER BY timestamp DESC LIMIT 20")
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
def list_readings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, stress_level, timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 50")
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
def get_reading(id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, stress_level, timestamp FROM sensor_data WHERE id = ?", (id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {}
    return {
        "id": row[0],
        "heart_rate": row[1],
        "stress_level": row[2],
        "timestamp": row[3],
    }

@router.post("/readings/")
def create_reading(payload: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    hr = int(payload.get("heart_rate", 0))
    stress_val = payload.get("stress_level", None)
    stress = float(stress_val) if stress_val is not None else None
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level) VALUES (?, ?, ?)",
        (hr, 98, stress if stress is not None else 0.0)
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
def create_reading_external(payload: Dict[str, Any]):
    conn = get_connection()
    cursor = conn.cursor()
    hr = int(payload.get("hr", 0))
    hrv_val = payload.get("hrv", None)
    hrv = float(hrv_val) if hrv_val is not None else None
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level) VALUES (?, ?, ?)",
        (hr, 98, hrv if hrv is not None else 0.0)
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
def get_pet():
    return {"mood": "calm", "level": 1}

@router.get("/streaks/mine/")
def get_streak(request: Request):
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    uid = parse_user_id_from_token(auth or "")
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT current_streak, max_streak, level, badges FROM gamification WHERE user_id = ?", (uid,))
    row = cur.fetchone()
    if not row:
        cur.execute("INSERT INTO gamification (user_id, current_streak, max_streak, level, badges) VALUES (?, 0, 0, 1, '')", (uid,))
        conn.commit()
        cur.execute("SELECT current_streak, max_streak, level, badges FROM gamification WHERE user_id = ?", (uid,))
        row = cur.fetchone()
    conn.close()
    return {"current_streak": row[0], "max_streak": row[1], "level": row[2], "badges": row[3]}

@router.post("/breathing-sessions/")
def create_breathing_session():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO breathing_sessions (duration_seconds) VALUES (60)")
    session_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": session_id, "started_at": "now", "completed": False}

@router.post("/breathing-sessions/{id}/complete/")
def complete_breathing_session(id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE breathing_sessions SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return {"id": id, "completed": True}
