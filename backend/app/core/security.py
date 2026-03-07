"""
JWT token management and password hashing.
Supports access tokens (short-lived) + refresh tokens (long-lived).
"""
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import bcrypt
from jose import jwt, JWTError
from app.config import settings


# ─────────────────────────────────────────
# Password Hashing
# ─────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


# ─────────────────────────────────────────
# JWT Tokens
# ─────────────────────────────────────────

def create_access_token(user_id: str, name: str, role: str, business_id: Optional[str] = None) -> str:
    payload = {
        "sub": user_id,
        "name": name,
        "role": role,
        "business_id": business_id,
        "type": "access",
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_ACCESS_HOURS),
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_DAYS),
        "iat": datetime.utcnow(),
        "jti": str(uuid.uuid4()),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token. Raises JWTError on failure."""
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
