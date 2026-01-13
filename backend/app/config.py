import os

class Settings:
    PROJECT_NAME: str = "CalmiPet API"
    PROJECT_VERSION: str = "1.0.0"
    # Using absolute path for volume mount if needed, or relative
    DATABASE_URL: str = "sqlite:///./data/calmipet.db"
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:8081",
        "*"
    ]

settings = Settings()
