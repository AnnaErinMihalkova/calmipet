from fastapi import FastAPI, HTTPException, Depends 
from fastapi.middleware.cors import CORSMiddleware 
from pydantic import BaseModel 
 
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
 
 
@app.post("/api/auth/register/") 
def auth_register(payload: RegisterPayload): 
    salt = generate_salt() 
    phash = hash_password(payload.password, salt) 
    with get_connection() as conn: 
        try: 
            cursor = conn.execute( 
                "INSERT INTO users (email, username, password, salt) VALUES (?, ?, ?, ?)", 
                (payload.email, payload.username, phash, salt), 
            ) 
            user_id = cursor.lastrowid 
            conn.commit() 
        except Exception: 
            raise HTTPException(status_code=400, detail="Email already registered") 
    token = make_token_for_user(user_id) 
    return {"token": token, "user_id": user_id} 
 
 
@app.post("/api/auth/login/") 
def auth_login(payload: LoginPayload): 
    with get_connection() as conn: 
        row = conn.execute( 
            "SELECT id, password, salt FROM users WHERE email = ?", (payload.email,) 
        ).fetchone() 
    if not row: 
        raise HTTPException(status_code=401, detail="Invalid credentials") 
    user_id, stored_hash, salt = row 
    if hash_password(payload.password, salt) != stored_hash: 
        raise HTTPException(status_code=401, detail="Invalid credentials") 
    token = make_token_for_user(user_id) 
    return {"token": token, "user_id": user_id} 
 
 
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