"""
Application configuration via environment variables.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/gst_app"

    # Auth
    JWT_SECRET: str = "dev-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRY_HOURS: int = 24

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
    GOOGLE_VISION_API_KEY: str = ""  # Get from console.cloud.google.com

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
