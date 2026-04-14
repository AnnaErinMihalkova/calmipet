import os

class Settings:
    PROJECT_NAME: str = "CalmiPet API"
    PROJECT_VERSION: str = "1.0.0"
    # Use environment variable for database URL, default to local SQLite
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./data/calmipet.db")
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8081",
        "*"
    ]

settings = Settings()
