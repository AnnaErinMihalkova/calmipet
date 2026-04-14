from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.config import settings
from app.routers import sensor
from app.models import User, LoginPayload, SignupPayload
from app.database import get_connection
from app.auth_utils import gen_salt, hash_password, verify_password, make_token_for_user, parse_user_id_from_token

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor.router, prefix="/api") 

def get_current_user_id(request: Request) -> int:
    auth = request.headers.get("authorization") or request.headers.get("Authorization") or ""
    uid = parse_user_id_from_token(auth or "")
    if uid is None:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return uid

@app.get("/")
def root():
    return {"status": "CalmiPet backend running"}

@app.get("/api/auth/me/")
def auth_me(uid: int = Depends(get_current_user_id)) -> User:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email, date_joined FROM users WHERE id = ?", (uid,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return User(id=row[0], username=row[1], email=row[2])

@app.post("/api/auth/logout/")
def auth_logout():
    return {"message": "logged out"}

@app.post("/api/auth/login/")
def auth_login(payload: LoginPayload):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT id, username, email, password_salt, password_hash FROM users WHERE email = ?", (payload.email,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    uid, username, email, salt, phash = row
    if not verify_password(payload.password, salt, phash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = make_token_for_user(uid)
    return {"accessToken": token, "refreshToken": token, "user": {"id": uid, "username": username, "email": email}}

@app.post("/api/auth/signup/")
def auth_signup(payload: SignupPayload):
    conn = get_connection()
    cur = conn.cursor()
    # Check if email exists
    cur.execute("SELECT id FROM users WHERE email = ?", (payload.email,))
    if cur.fetchone():
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    salt = gen_salt()
    phash = hash_password(payload.password, salt)
    cur.execute(
        "INSERT INTO users (email, username, password_salt, password_hash) VALUES (?, ?, ?, ?)",
        (payload.email, payload.username, salt, phash)
    )
    uid = cur.lastrowid
    conn.commit()
    conn.close()
    token = make_token_for_user(uid)
    return {"accessToken": token, "refreshToken": token, "user": {"id": uid, "username": payload.username, "email": payload.email}}

@app.post("/api/auth/update/")
def auth_update(payload: User, uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cur = conn.cursor()
    # Only allow changing username/email
    cur.execute("UPDATE users SET username = ?, email = ? WHERE id = ?", (payload.username, payload.email, uid))
    conn.commit()
    cur.execute("SELECT id, username, email FROM users WHERE id = ?", (uid,))
    row = cur.fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": row[0], "username": row[1], "email": row[2]}

@app.post("/api/auth/promote/")
def auth_promote(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_admin = 1 WHERE id = ?", (uid,))
    conn.commit()
    conn.close()
    return {"message": "promoted", "user_id": uid}

@app.delete("/api/auth/delete/")
def auth_delete(uid: int = Depends(get_current_user_id)):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE id = ?", (uid,))
    conn.commit()
    conn.close()
    return {"message": "deleted"}
