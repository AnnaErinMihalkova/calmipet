from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel
import sqlite3
import os
 
from app.config import settings 
from app.database import init_db, get_connection 
from app.auth_utils import hash_password, generate_salt, make_token_for_user
from app.routers.sensor import router as sensor_router, get_current_user_id 
 
app = FastAPI(title="CalmIPet API") 
 
# --------------------------------------------------------------------------- 
# CORS — explicit origins only, wildcard removed (#3) 
# --------------------------------------------------------------------------- 
app.add_middleware( 
    CORSMiddleware, 
    allow_origins=settings.CORS_ORIGINS, 
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
) 
 
app.include_router(sensor_router) 
 
 
@app.on_event("startup") 
def startup(): 
    init_db() 
 
 
# --------------------------------------------------------------------------- 
# Auth routes 
# --------------------------------------------------------------------------- 
 
class RegisterPayload(BaseModel): 
    email: str 
    username: str 
    password: str 
 
 
class LoginPayload(BaseModel): 
    email: str 
    password: str 


def _normalize_email(email: str) -> str:
    return email.strip().lower()

def _get_users_columns(conn) -> set[str]:
    try:
        cols = conn.execute("PRAGMA table_info(users)").fetchall()
        return {c[1] for c in cols}
    except Exception:
        return set()


class ResetPasswordPayload(BaseModel):
    email: str
    new_password: str
 
 
@app.post("/api/auth/register/") 
def auth_register(payload: RegisterPayload): 
    email = _normalize_email(payload.email)
    username = payload.username.strip()
    if not email or not username or not payload.password:
        raise HTTPException(status_code=400, detail="Missing required fields")
    salt = generate_salt() 
    phash = hash_password(payload.password, salt) 
    with get_connection() as conn: 
        users_cols = _get_users_columns(conn)
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        try: 
            if {"password_hash", "password_salt"}.issubset(users_cols):
                cursor = conn.execute(
                    "INSERT INTO users (email, username, password_hash, password_salt, password, salt) VALUES (?, ?, ?, ?, ?, ?)",
                    (email, username, phash, salt, phash, salt),
                )
            else:
                cursor = conn.execute(
                    "INSERT INTO users (email, username, password, salt) VALUES (?, ?, ?, ?)",
                    (email, username, phash, salt),
                )
            user_id = cursor.lastrowid 
            conn.commit() 
        except sqlite3.IntegrityError as exc:
            msg = str(exc)
            # Only report "already registered" when the UNIQUE(email) constraint actually failed.
            if "UNIQUE constraint failed: users.email" in msg:
                raise HTTPException(status_code=400, detail="Email already registered")
            print(f"[ERROR] Registration integrity error: {exc}")
            raise HTTPException(status_code=500, detail="Registration failed")
        except Exception as exc:
            print(f"[ERROR] Registration failed: {exc}")
            raise HTTPException(status_code=500, detail="Registration failed")
    token = make_token_for_user(user_id) 
    return {"token": token, "user_id": user_id} 
 
 
@app.post("/api/auth/login/") 
def auth_login(payload: LoginPayload): 
    email = _normalize_email(payload.email)
    with get_connection() as conn: 
        users_cols = _get_users_columns(conn)
        if {"password_hash", "password_salt"}.issubset(users_cols):
            row = conn.execute(
                "SELECT id, password_hash, password_salt, password, salt FROM users WHERE email = ?",
                (email,),
            ).fetchone()
        else:
            row = conn.execute(
                "SELECT id, password, salt FROM users WHERE email = ?",
                (email,),
            ).fetchone()
    if not row: 
        raise HTTPException(status_code=401, detail="Invalid credentials") 
    if len(row) == 3:
        user_id, stored_hash, salt = row
    else:
        user_id, legacy_hash, legacy_salt, new_hash, new_salt = row
        # Prefer legacy columns when present (they are NOT NULL in older DBs)
        stored_hash, salt = (legacy_hash, legacy_salt) if legacy_hash and legacy_salt else (new_hash, new_salt)
    if hash_password(payload.password, salt) != stored_hash:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token_for_user(user_id) 
    return {"token": token, "user_id": user_id} 


@app.post("/api/auth/reset-password/")
def auth_reset_password(payload: ResetPasswordPayload):
    """
    Dev-only password reset for local/demo environments.
    Disabled by default; enable by setting CALMIPET_DEV_PASSWORD_RESET=1.
    """
    if os.environ.get("CALMIPET_DEV_PASSWORD_RESET", "").lower() not in ("1", "true", "yes"):
        raise HTTPException(status_code=404, detail="Not found")

    email = _normalize_email(payload.email)
    if not email or not payload.new_password:
        raise HTTPException(status_code=400, detail="Missing required fields")

    salt = generate_salt()
    phash = hash_password(payload.new_password, salt)
    with get_connection() as conn:
        users_cols = _get_users_columns(conn)
        row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        if {"password_hash", "password_salt"}.issubset(users_cols):
            conn.execute(
                "UPDATE users SET password_hash = ?, password_salt = ?, password = ?, salt = ? WHERE email = ?",
                (phash, salt, phash, salt, email),
            )
        else:
            conn.execute(
                "UPDATE users SET password = ?, salt = ? WHERE email = ?",
                (phash, salt, email),
            )
        conn.commit()
    return {"status": "ok"}
 
 
@app.get("/api/auth/me/") 
def auth_me(user_id: int = Depends(get_current_user_id)): 
    with get_connection() as conn: 
        row = conn.execute( 
            "SELECT id, email, username, is_admin, pet_type FROM users WHERE id = ?", 
            (user_id,), 
        ).fetchone() 
    if not row: 
        raise HTTPException(status_code=404, detail="User not found") 
    return { 
        "id": row[0], 
        "email": row[1], 
        "username": row[2], 
        "is_admin": bool(row[3]), 
        "pet_type": row[4], 
    } 
 
 
# NOTE: /api/auth/promote/ has been intentionally removed. 
# To grant admin rights, update the database directly or add a 
# protected admin-only endpoint that checks is_admin on the caller. (#4) 
 
 
@app.patch("/api/users/pet/") 
def update_pet(pet_type: str, user_id: int = Depends(get_current_user_id)): 
    allowed = {"raccoon", "cat", "fox", "owl"} 
    if pet_type not in allowed: 
        raise HTTPException(status_code=400, detail=f"pet_type must be one of {allowed}") 
    with get_connection() as conn: 
        conn.execute( 
            "UPDATE users SET pet_type = ? WHERE id = ?", (pet_type, user_id) 
        ) 
        conn.commit() 
    return {"pet_type": pet_type}