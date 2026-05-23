import os
from pydantic_settings import BaseSettings, SettingsConfigDict

_DEFAULT_CORS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:8081",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]


def _parse_origins(raw: str | None) -> list[str]:
    if not raw:
        return []
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "CalmiPet API"
    PROJECT_VERSION: str = "1.0.0"

    # Database
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./data/calmipet.db")

    # Auth
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "CHANGE_ME_BEFORE_PRODUCTION")
    JWT_EXPIRY_HOURS: int = int(os.environ.get("JWT_EXPIRY_HOURS", "24"))

    # CORS — comma-separated string in .env (not JSON array)
    CORS_ORIGINS: str = ""

    def cors_origins_list(self) -> list[str]:
        parsed = _parse_origins(self.CORS_ORIGINS)
        return parsed or _DEFAULT_CORS

    # For local mobile testing and Render deployment, we allow private network IPs and render domains via regex
    CORS_ORIGIN_REGEX: str | None = os.environ.get(
        "CORS_ORIGIN_REGEX",
        r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|172\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|.*\.onrender\.com)(:\d+)?$",
    )


settings = Settings()
