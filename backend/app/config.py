"""
Application configuration via environment variables.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database (SQLAlchemy async — primary connection)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/gst_app"

    # Supabase SDK (optional — for storage, auth, realtime)
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""

    # Auth — JWT
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_HOURS: int = 24
    JWT_REFRESH_DAYS: int = 30

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Storage (Cloudflare R2 / S3)
    S3_ENDPOINT_URL: str = ""
    S3_ACCESS_KEY: str = ""
    S3_SECRET_KEY: str = ""
    S3_BUCKET_NAME: str = "gst-bills"
    S3_REGION: str = "auto"

    # OCR
    TESSERACT_CMD: str = "tesseract"

    # Redis (optional — graceful fallback if not configured)
    REDIS_URL: str = ""

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60

    # App
    APP_NAME: str = "GSTFlow"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
