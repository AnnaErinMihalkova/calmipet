from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel

from app.auth_utils import parse_user_id_from_token
from app.database import (
    get_connection,
    fetchone,
    fetchall,
    execute,
    insert_returning_id,
    is_postgres,
)

router = APIRouter()

RATE_LIMIT_SECONDS = 30


def get_current_user_id(request: Request) -> int:
    auth = request.headers.get("authorization", "")
    uid = parse_user_id_from_token(auth)
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return uid


def _too_soon(user_id: int) -> bool:
    with get_connection() as conn:
        try:
            row = fetchone(
                conn,
                "SELECT timestamp FROM readings WHERE user_id = ? ORDER BY id DESC LIMIT 1",
                (user_id,),
            )
            if not row:
                return False
            last_str = str(row[0])
            last = datetime.fromisoformat(last_str.replace(" ", "T"))
            if last.tzinfo is None:
                last = last.replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            return (now - last) < timedelta(seconds=RATE_LIMIT_SECONDS)
        except (ValueError, TypeError):
            return False


class DataPayload(BaseModel):
    heart_rate: float
    hrv: float | None = None
    stress_level: float | None = None


class BreathingSessionStart(BaseModel):
    pass


@router.post("/api/data")
def add_data(
    payload: DataPayload,
    user_id: int = Depends(get_current_user_id),
):
    if _too_soon(user_id):
        raise HTTPException(status_code=429, detail="Too many readings")

    with get_connection() as conn:
        try:
            execute(
                conn,
                """
                INSERT INTO readings (user_id, heart_rate, hrv, stress_level)
                VALUES (?, ?, ?, ?)
                """,
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
        rows = fetchall(
            conn,
            """
            SELECT id, heart_rate, hrv, stress_level, timestamp
            FROM readings WHERE user_id = ?
            ORDER BY id DESC LIMIT ?
            """,
            (user_id, limit),
        )
    return [
        {
            "id": r[0],
            "heart_rate": r[1],
            "hrv": r[2],
            "stress_level": r[3],
            "timestamp": r[4].isoformat() if hasattr(r[4], "isoformat") else r[4],
        }
        for r in rows
    ]


@router.post("/api/analyze")
def analyze(
    payload: DataPayload,
    user_id: int = Depends(get_current_user_id),
):
    hrv = payload.hrv or payload.stress_level or payload.heart_rate
    hr = payload.heart_rate

    hr_factor = max(0.0, min(1.0, (hr - 60) / 40.0))
    hrv_factor = max(0.0, min(1.0, (80 - hrv) / 60.0))
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
        "hr": hr,
    }


@router.post("/api/breathing/start")
def start_breathing_session(
    user_id: int = Depends(get_current_user_id),
):
    with get_connection() as conn:
        try:
            session_id = insert_returning_id(
                conn,
                "INSERT INTO breathing_sessions (user_id) VALUES (?)",
                (user_id,),
            )
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
            row = fetchone(
                conn,
                "SELECT id FROM breathing_sessions WHERE id = ? AND user_id = ?",
                (session_id, user_id),
            )
            if not row:
                raise HTTPException(status_code=404, detail="Session not found")

            execute(
                conn,
                "UPDATE breathing_sessions SET completed = ? WHERE id = ?",
                (True if is_postgres() else 1, session_id),
            )

            gam = fetchone(
                conn, "SELECT id, streak FROM gamification WHERE user_id = ?", (user_id,)
            )
            today = datetime.now(timezone.utc).date().isoformat()

            if not gam:
                execute(
                    conn,
                    """
                    INSERT INTO gamification
                        (user_id, streak, xp, last_session_date, sessions_today)
                    VALUES (?, 1, 10, ?, 1)
                    """,
                    (user_id, today),
                )
            else:
                gam_id, streak = gam
                execute(
                    conn,
                    """
                    UPDATE gamification
                    SET streak = ?, xp = xp + 10,
                        last_session_date = ?, sessions_today = sessions_today + 1
                    WHERE id = ?
                    """,
                    (streak + 1, today, gam_id),
                )

            conn.commit()

        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Database error") from exc

    return {"id": session_id, "completed": True}


@router.get("/api/breathing/streak")
def get_streak(
    user_id: int = Depends(get_current_user_id),
):
    with get_connection() as conn:
        row = fetchone(
            conn,
            "SELECT streak, xp, last_session_date, sessions_today FROM gamification WHERE user_id = ?",
            (user_id,),
        )
    if not row:
        return {"streak": 0, "xp": 0, "last_session_date": None, "sessions_today": 0}
    return {
        "streak": row[0],
        "xp": row[1],
        "last_session_date": row[2],
        "sessions_today": row[3],
    }
