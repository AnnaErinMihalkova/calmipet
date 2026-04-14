import os 
from pydantic_settings import BaseSettings 
 
 
def _parse_origins(raw: str | None) -> list[str]: 
    if not raw: 
        return [] 
    return [o.strip() for o in raw.split(",") if o.strip()] 
 
 
class Settings(BaseSettings): 
    PROJECT_NAME: str = "CalmiPet API"
    PROJECT_VERSION: str = "1.0.0"

    # Database 
    DATABASE_URL: str = os.environ.get("DATABASE_URL", "sqlite:///./data/calmipet.db") 
 
    # Auth 
    JWT_SECRET: str = os.environ.get("JWT_SECRET", "CHANGE_ME_BEFORE_PRODUCTION") 
    JWT_EXPIRY_HOURS: int = int(os.environ.get("JWT_EXPIRY_HOURS", "24")) 
 
    # CORS — explicit origins only; no wildcard (#3) 
    CORS_ORIGINS: list[str] = ( 
        _parse_origins(os.environ.get("CORS_ORIGINS")) 
        or [ 
            "http://localhost:3000", 
            "http://localhost:3001", 
            "http://localhost:3002",
            "http://localhost:8081",
            "http://127.0.0.1:3000", 
            "http://127.0.0.1:3001", 
        ] 
    ) 
 
    class Config: 
        env_file = ".env" 
 
 
settings = Settings()
