from datetime import datetime, timedelta, timezone 
from fastapi import APIRouter, Depends, HTTPException, Request 
from pydantic import BaseModel 
 
from app.auth_utils import parse_user_id_from_token 
from app.database import get_connection 
 
router = APIRouter() 
 
# --------------------------------------------------------------------------- 
# Auth dependency — replaces 8 copy-pasted auth blocks (#23) 
# --------------------------------------------------------------------------- 
 
def get_current_user_id(request: Request) -> int: 
    """FastAPI dependency: parse & validate the Bearer token; raise 401 on failure.""" 
    auth = request.headers.get("authorization", "") 
    uid = parse_user_id_from_token(auth) 
    if uid is None: 
        raise HTTPException(status_code=401, detail="Unauthorized") 
    return uid 
 
 
# --------------------------------------------------------------------------- 
# Rate-limit helper — fixed datetime comparison (#8) 
# --------------------------------------------------------------------------- 
 
RATE_LIMIT_SECONDS = 30 
 
 
def _too_soon(user_id: int) -> bool: 
    """ 
    Return True if the user submitted a reading within the last 
    RATE_LIMIT_SECONDS seconds. 
    Uses timezone-aware UTC datetimes throughout (#8). 
    """ 
    with get_connection() as conn: 
        try: 
            row = conn.execute( 
                "SELECT timestamp FROM readings WHERE user_id = ? ORDER BY id DESC LIMIT 1", 
                (user_id,), 
            ).fetchone() 
            if not row: 
                return False 
            # Store and compare as UTC-aware datetimes (#8) 
            last_str: str = row[0] 
            # Handle both "2024-01-01T12:00:00" and "2024-01-01 12:00:00" formats 
            last = datetime.fromisoformat(last_str.replace(" ", "T")) 
            if last.tzinfo is None: 
                last = last.replace(tzinfo=timezone.utc) 
            now = datetime.now(timezone.utc) 
            return (now - last) < timedelta(seconds=RATE_LIMIT_SECONDS) 
        except (ValueError, TypeError): 
            return False 
 
 
# --------------------------------------------------------------------------- 
# Pydantic models 
# --------------------------------------------------------------------------- 
 
class DataPayload(BaseModel): 
    heart_rate: float 
    hrv: float | None = None 
    stress_level: float | None = None 
 
 
class BreathingSessionStart(BaseModel): 
    pass 
 
 
# --------------------------------------------------------------------------- 
# Endpoints 
# --------------------------------------------------------------------------- 
 
@router.post("/api/data") 
def add_data( 
    payload: DataPayload, 
    user_id: int = Depends(get_current_user_id),   # now requires auth (#17) 
): 
    if _too_soon(user_id): 
        raise HTTPException(status_code=429, detail="Too many readings") 
 
    with get_connection() as conn: 
        try: 
            conn.execute( 
                """INSERT INTO readings (user_id, heart_rate, hrv, stress_level) 
                   VALUES (?, ?, ?, ?)""", 
                (user_id, payload.heart_rate, payload.hrv, payload.stress_level), 
            ) 
            conn.commit() 
        except Exception as exc: 
            raise HTTPException(status_code=500, detail="Database error") from exc 
 
    return {"status": "ok"} 
 
 
@router.get("/api/data") 
def get_data( 
    limit: int = 50, 
    user_id: int = Depends(get_current_user_id), 
): 
    with get_connection() as conn: 
        rows = conn.execute( 
            """SELECT id, heart_rate, hrv, stress_level, timestamp 
               FROM readings WHERE user_id = ? 
               ORDER BY id DESC LIMIT ?""", 
            (user_id, limit), 
        ).fetchall() 
    return [ 
        { 
            "id": r[0], 
            "heart_rate": r[1], 
            "hrv": r[2], 
            "stress_level": r[3], 
            "timestamp": r[4], 
        } 
        for r in rows 
    ] 
 
 
@router.post("/api/analyze") 
def analyze( 
    payload: DataPayload, 
    user_id: int = Depends(get_current_user_id),   # now requires auth (#17) 
): 
    """Improved combined HR/HRV stress analysis.""" 
    hrv = payload.hrv or payload.stress_level or payload.heart_rate 
    hr = payload.heart_rate

    # Calculate an accurate 0-100 stress score based on both HR and HRV
    # High HR (e.g. > 85) increases stress
    # Low HRV (e.g. < 30) increases stress
    
    # 1. Normalize HR (Resting range 60-100)
    # Higher HR = higher stress component
    hr_factor = max(0.0, min(1.0, (hr - 60) / 40.0))
    
    # 2. Normalize HRV (Typical RMSSD range 20-80)
    # Lower HRV = higher stress component
    hrv_factor = max(0.0, min(1.0, (80 - hrv) / 60.0))
    
    # 3. Weighted combination (HRV is generally a stronger indicator of stress than raw HR)
    stress_score = (0.4 * hr_factor + 0.6 * hrv_factor) * 100

    if stress_score > 65: 
        label = "stressed" 
    elif stress_score > 35: 
        label = "moderate" 
    else: 
        label = "calm" 
        
    return {
        "user_id": user_id, 
        "stress_label": label, 
        "stress_score": round(stress_score),
        "hrv": hrv,
        "hr": hr
    } 
 
 
@router.post("/api/breathing/start") 
def start_breathing_session( 
    user_id: int = Depends(get_current_user_id), 
): 
    with get_connection() as conn: 
        try: 
            cursor = conn.execute( 
                "INSERT INTO breathing_sessions (user_id) VALUES (?)", (user_id,) 
            ) 
            session_id = cursor.lastrowid 
            conn.commit() 
        except Exception as exc: 
            raise HTTPException(status_code=500, detail="Database error") from exc 
    return {"id": session_id} 
 
 
@router.post("/api/breathing/{session_id}/complete") 
def complete_breathing_session( 
    session_id: int, 
    user_id: int = Depends(get_current_user_id), 
): 
    with get_connection() as conn: 
        try: 
            row = conn.execute( 
                "SELECT id FROM breathing_sessions WHERE id = ? AND user_id = ?", 
                (session_id, user_id), 
            ).fetchone() 
            if not row: 
                raise HTTPException(status_code=404, detail="Session not found") 
 
            conn.execute( 
                "UPDATE breathing_sessions SET completed = 1 WHERE id = ?", 
                (session_id,), 
            ) 
 
            # Upsert gamification row — commit is NOT missing here (#9) 
            gam = conn.execute( 
                "SELECT id, streak FROM gamification WHERE user_id = ?", (user_id,) 
            ).fetchone() 
 
            today = datetime.now(timezone.utc).date().isoformat() 
 
            if not gam: 
                conn.execute( 
                    """INSERT INTO gamification 
                           (user_id, streak, xp, last_session_date, sessions_today) 
                       VALUES (?, 1, 10, ?, 1)""", 
                    (user_id, today), 
                ) 
            else: 
                gam_id, streak = gam 
                conn.execute( 
                    """UPDATE gamification 
                       SET streak = ?, xp = xp + 10, 
                           last_session_date = ?, sessions_today = sessions_today + 1 
                       WHERE id = ?""", 
                    (streak + 1, today, gam_id), 
                ) 
 
            conn.commit()  # single commit covers all writes above (#9) 
 
        except HTTPException: 
            raise 
        except Exception as exc: 
            raise HTTPException(status_code=500, detail="Database error") from exc 
 
    # No duplicate return (#5) 
    return {"id": session_id, "completed": True} 
 
 
@router.get("/api/breathing/streak") 
def get_streak( 
    user_id: int = Depends(get_current_user_id), 
): 
    with get_connection() as conn: 
        row = conn.execute( 
            "SELECT streak, xp, last_session_date, sessions_today FROM gamification WHERE user_id = ?", 
            (user_id,), 
        ).fetchone() 
    if not row: 
        return {"streak": 0, "xp": 0, "last_session_date": None, "sessions_today": 0} 
    return { 
        "streak": row[0], 
        "xp": row[1], 
        "last_session_date": row[2], 
        "sessions_today": row[3], 
    }