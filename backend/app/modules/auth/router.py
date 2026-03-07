"""Auth module — Register, Login, Token Refresh, Profile."""
from datetime import datetime, timedelta
from uuid import UUID
import hashlib

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.config import settings
from app.models import User, Business, RefreshToken
from app.core.security import (
    hash_password, verify_password, create_access_token,
    create_refresh_token, decode_token,
)
from app.core.exceptions import DuplicateError, UnauthorizedError
from app.modules.auth.schemas import (
    RegisterRequest, LoginRequest, RefreshRequest, BusinessSetupRequest,
    TokenResponse, UserProfile,
)
from app.services.validation import validate_gstin
from app.services.indian_states import get_state_name

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.phone == req.phone))
    if existing.scalar_one_or_none():
        raise DuplicateError("Phone already registered")

    user = User(
        phone=req.phone,
        password_hash=hash_password(req.password),
        name=req.name,
        email=req.email,
    )
    db.add(user)
    await db.flush()

    access = create_access_token(str(user.id), user.name, user.role)
    refresh = create_refresh_token(str(user.id))

    # Store refresh token hash
    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hashlib.sha256(refresh.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_DAYS),
    )
    db.add(token_record)

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user_id=str(user.id),
        name=user.name,
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise UnauthorizedError("Invalid credentials")

    # Check if user has a business
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id).limit(1))
    biz = biz_result.scalar_one_or_none()

    access = create_access_token(
        str(user.id), user.name, user.role,
        business_id=str(biz.id) if biz else None,
    )
    refresh = create_refresh_token(str(user.id))

    token_record = RefreshToken(
        user_id=user.id,
        token_hash=hashlib.sha256(refresh.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_DAYS),
    )
    db.add(token_record)

    return TokenResponse(
        access_token=access,
        refresh_token=refresh,
        user_id=str(user.id),
        name=user.name,
        role=user.role,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise UnauthorizedError("Invalid token type")
    except Exception:
        raise UnauthorizedError("Invalid or expired refresh token")

    token_hash = hashlib.sha256(req.refresh_token.encode()).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        )
    )
    stored = result.scalar_one_or_none()
    if not stored:
        raise UnauthorizedError("Refresh token revoked or not found")

    # Revoke old token
    stored.revoked = True

    user_id = payload["sub"]
    user_result = await db.execute(select(User).where(User.id == UUID(user_id)))
    user = user_result.scalar_one_or_none()
    if not user:
        raise UnauthorizedError("User not found")

    biz_result = await db.execute(select(Business).where(Business.user_id == user.id).limit(1))
    biz = biz_result.scalar_one_or_none()

    new_access = create_access_token(
        str(user.id), user.name, user.role,
        business_id=str(biz.id) if biz else None,
    )
    new_refresh = create_refresh_token(str(user.id))

    new_token_record = RefreshToken(
        user_id=user.id,
        token_hash=hashlib.sha256(new_refresh.encode()).hexdigest(),
        expires_at=datetime.utcnow() + timedelta(days=settings.JWT_REFRESH_DAYS),
    )
    db.add(new_token_record)

    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        user_id=str(user.id),
        name=user.name,
        role=user.role,
    )


@router.post("/setup-business")
async def setup_business(
    req: BusinessSetupRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    gstin_value = req.gstin.strip() if req.gstin else None
    if gstin_value:
        gstin_results = validate_gstin(gstin_value)
        failed = [r for r in gstin_results if not r.passed and r.severity == "critical"]
        if failed:
            raise HTTPException(status_code=400, detail=failed[0].message)

    state_name = get_state_name(req.state_code) or req.state_name

    business = Business(
        user_id=user.id,
        name=req.name,
        gstin=gstin_value,
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


@router.get("/me", response_model=UserProfile)
async def get_profile(user: User = Depends(get_current_user)):
    return UserProfile(
        id=str(user.id),
        name=user.name,
        phone=user.phone,
        email=user.email,
        role=user.role,
    )
