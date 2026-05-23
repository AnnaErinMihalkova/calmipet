import os
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
from app.stress_engine import calculate_stress, level_to_stress_label, stress_from_reading

router = APIRouter()

RATE_LIMIT_SECONDS = int(os.environ.get("CALMIPET_RATE_LIMIT_SECONDS", "5"))


def get_current_user_id(request: Request) -> int:
    auth = request.headers.get("authorization", "")
    uid = parse_user_id_from_token(auth)
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return uid


def _rate_limit_skipped() -> bool:
    return os.environ.get("CALMIPET_SKIP_RATE_LIMIT", "").lower() in ("1", "true", "yes")


def _too_soon(user_id: int) -> bool:
    if _rate_limit_skipped():
        return False
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


def _recent_hr_history(user_id: int, limit: int = 20) -> list[float]:
    with get_connection() as conn:
        rows = fetchall(
            conn,
            """
            SELECT heart_rate FROM readings
            WHERE user_id = ? AND heart_rate IS NOT NULL
            ORDER BY id DESC LIMIT ?
            """,
            (user_id, limit),
        )
    if not rows:
        return []
    # Oldest first for HRV proxy calculation
    return [float(r[0]) for r in reversed(rows)]


def _baseline_hr(hr_history: list[float], fallback: float = 65.0) -> float:
    if not hr_history:
        return fallback
    return sum(hr_history) / len(hr_history)


class DataPayload(BaseModel):
    heart_rate: float
    hrv: float | None = None
    spo2: float | None = None
    stress_level: float | None = None


class AnalyzePayload(BaseModel):
    heart_rate: float
    hrv: float | None = None
    spo2: float | None = None


class BreathingSessionStart(BaseModel):
    pass


def _compute_stress_for_user(
    user_id: int,
    heart_rate: float,
    hrv: float | None = None,
    spo2: float | None = None,
) -> dict:
    hr_history = _recent_hr_history(user_id)
    baseline = _baseline_hr(hr_history)
    result = calculate_stress(
        heart_rate=heart_rate,
        spo2=spo2 if spo2 is not None else 98.0,
        hr_history=hr_history,
        baseline_hr=baseline,
        age=30,
        hrv_rmssd=hrv,
    )
    return {
        "result": result,
        "baseline_hr": baseline,
        "history_count": len(hr_history),
    }


@router.post("/api/data")
def add_data(
    payload: DataPayload,
    user_id: int = Depends(get_current_user_id),
):
    if _too_soon(user_id):
        raise HTTPException(status_code=429, detail="Too many readings")

    computed = _compute_stress_for_user(
        user_id,
        payload.heart_rate,
        hrv=payload.hrv,
        spo2=payload.spo2,
    )
    result = computed["result"]
    stress_level = (
        payload.stress_level
        if payload.stress_level is not None
        else result.score
    )

    with get_connection() as conn:
        try:
            execute(
                conn,
                """
                INSERT INTO readings (user_id, heart_rate, hrv, stress_level)
                VALUES (?, ?, ?, ?)
                """,
                (user_id, payload.heart_rate, payload.hrv, stress_level),
            )
            conn.commit()
        except Exception as exc:
            raise HTTPException(status_code=500, detail="Database error") from exc

    return {
        "status": "ok",
        "stress_level": round(stress_level, 1),
        "stress_score": round(result.score, 1),
        "stress_label": level_to_stress_label(result.level),
        "level": result.level,
        "baseline_hr": round(computed["baseline_hr"], 1),
        "alerts": result.alerts,
    }


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
def analyze_data(
    payload: AnalyzePayload,
    user_id: int = Depends(get_current_user_id),
):
    computed = _compute_stress_for_user(
        user_id,
        payload.heart_rate,
        hrv=payload.hrv,
        spo2=payload.spo2,
    )
    result = computed["result"]
    analysis = stress_from_reading(
        {
            "heart_rate": payload.heart_rate,
            "spo2": payload.spo2 if payload.spo2 is not None else 98.0,
            "hrv": payload.hrv,
        },
        {
            "hr_history": _recent_hr_history(user_id),
            "baseline_hr": computed["baseline_hr"],
            "age": 30,
        },
    )
    return {
        "heart_rate": payload.heart_rate,
        "spo2": payload.spo2 if payload.spo2 is not None else 98.0,
        "hrv": payload.hrv,
        "baseline_hr": round(computed["baseline_hr"], 2),
        "score": round(result.score / 100.0, 3),
        "stress_score": round(result.score, 1),
        "level": result.level,
        "label": result.level,
        "stress_label": analysis["stress_label"],
        "confidence": result.confidence,
        "factors": result.factors,
        "alerts": result.alerts,
        "history_count": computed["history_count"],
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
