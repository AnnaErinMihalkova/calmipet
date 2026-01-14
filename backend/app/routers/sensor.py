from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.database import get_connection
from app.models import DataPayload, AnalyzePayload

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

# Mock Endpoints for Mobile App compatibility

@router.get("/readings/")
def list_readings():
    """List readings formatted for mobile app"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, stress_level, timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 50")
    rows = cursor.fetchall()
    conn.close()
    
    # Map to mobile app format
    items = []
    for r in rows:
        items.append({
            "id": r[0],
            "hr_bpm": r[1],
            "hrv_rmssd": r[2], # using stress_level as proxy for HRV
            "ts": r[3],
            "user": 1
        })
    return items

@router.get("/readings/{id}/")
def get_reading(id: int):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, heart_rate, stress_level, timestamp FROM sensor_data WHERE id = ?", (id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "id": row[0],
            "hr_bpm": row[1],
            "hrv_rmssd": row[2],
            "ts": row[3],
            "user": 1
        }
    return {}

@router.post("/readings/")
def create_reading(payload: Dict[str, Any]):
    """Create reading from mobile app"""
    conn = get_connection()
    cursor = conn.cursor()
    
    hr = payload.get("hr_bpm", 0)
    stress = payload.get("hrv_rmssd", 0.0)
    
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level) VALUES (?, ?, ?)",
        (hr, 98, stress) # Default SpO2 to 98
    )
    conn.commit()
    conn.close()
    return {"message": "Data saved", "id": 0, "hr_bpm": hr, "hrv_rmssd": stress, "ts": "now", "user": 1}

@router.post("/bracelet/readings/")
def create_reading_external(payload: Dict[str, Any]):
    """Bracelet simulator endpoint"""
    conn = get_connection()
    cursor = conn.cursor()
    hr = payload.get("hr", 0)
    hrv = payload.get("hrv", 0.0)
    cursor.execute(
        "INSERT INTO sensor_data (heart_rate, spo2, stress_level) VALUES (?, ?, ?)",
        (hr, 98, hrv)
    )
    conn.commit()
    conn.close()
    return {"message": "Data saved", "id": 0, "hr_bpm": hr, "hrv_rmssd": hrv, "ts": "now", "user": 1}

@router.get("/pets/mine/")
def get_pet():
    return {"mood": "calm", "level": 1}

@router.get("/streaks/mine/")
def get_streak():
    return {"current_streak": 5, "max_streak": 10}

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
