from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_db
from app.config import settings
from app.routers import sensor
from app.models import User, LoginPayload, SignupPayload

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

app.include_router(sensor.router)
# Also mount router under /api to match legacy Django URLs if needed, or mobile config points to /api
app.include_router(sensor.router, prefix="/api") 

@app.get("/")
def root():
    return {"status": "CalmiPet backend running"}

# Mock Auth for now
@app.get("/api/auth/me/")
def auth_me(request: Request) -> User:
    # Allow any token for now
    auth = request.headers.get("authorization") or request.headers.get("Authorization")
    # if not auth or not auth.startswith("Bearer "):
    #    raise HTTPException(status_code=401, detail="Unauthorized")
    return User(id=1, username="demo", email="demo@example.com")

@app.post("/api/auth/logout/")
def auth_logout():
    return {"message": "logged out"}

@app.post("/api/auth/login/")
def auth_login(payload: LoginPayload):
    return {
        "accessToken": "mock-access-token",
        "refreshToken": "mock-refresh-token",
        "user": {"id": 1, "username": "demo", "email": payload.email}
    }

@app.post("/api/auth/signup/")
def auth_signup(payload: SignupPayload):
    return {
        "accessToken": "mock-access-token",
        "refreshToken": "mock-refresh-token",
        "user": {"id": 1, "username": payload.username, "email": payload.email}
    }

@app.post("/api/auth/refresh/")
def auth_refresh():
    return {
        "accessToken": "mock-access-token-refreshed",
        "refreshToken": "mock-refresh-token-new"
    }

@app.post("/api/privacy/reset-data/")
def reset_data():
    return {"message": "Data reset (mock)"}
