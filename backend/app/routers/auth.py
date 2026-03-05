"""
Auth API — Register, Login, Business Setup.
"""
from datetime import datetime, timedelta
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from passlib.hash import bcrypt
from jose import jwt

from app.database import get_db
from app.config import settings
from app.models import User, Business
from app.schemas import RegisterRequest, LoginRequest, BusinessSetupRequest, TokenResponse
from app.services.validation import validate_gstin
from app.services.indian_states import get_state_name

router = APIRouter()


def create_token(user_id: str, name: str) -> str:
    payload = {
        "sub": user_id,
        "name": name,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRY_HOURS),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
) -> User:
    """Dependency: extract and validate JWT from Authorization header.
    In production, extract from request headers. Simplified here."""
    # This is a placeholder — in the real app, parse Authorization header
    # For now, return the first user for demo purposes
    result = await db.execute(select(User).limit(1))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new user."""
    # Check if phone already exists
    existing = await db.execute(select(User).where(User.phone == req.phone))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Phone already registered")

    user = User(
        phone=req.phone,
        password_hash=bcrypt.hash(req.password),
        name=req.name,
        email=req.email,
    )
    db.add(user)
    await db.flush()

    token = create_token(str(user.id), user.name)
    return TokenResponse(access_token=token, user_id=str(user.id), name=user.name)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login with phone + password."""
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()

    if not user or not bcrypt.verify(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(str(user.id), user.name)
    return TokenResponse(access_token=token, user_id=str(user.id), name=user.name)


@router.post("/setup-business")
async def setup_business(
    req: BusinessSetupRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Set up business profile after registration."""
    # Validate GSTIN
    gstin_results = validate_gstin(req.gstin)
    failed = [r for r in gstin_results if not r.passed and r.severity == "critical"]
    if failed:
        raise HTTPException(status_code=400, detail=failed[0].message)

    state_name = get_state_name(req.state_code) or req.state_name

    business = Business(
        user_id=user.id,
        name=req.name,
        gstin=req.gstin,
        state_code=req.state_code,
        state_name=state_name,
        business_type=req.business_type,
        address=req.address,
        pincode=req.pincode,
        financial_year=req.financial_year,
    )
    db.add(business)
    await db.flush()

    return {"id": str(business.id), "name": business.name, "gstin": business.gstin}
