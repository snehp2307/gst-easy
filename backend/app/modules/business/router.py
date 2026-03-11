from uuid import UUID
"""
Business module — Business profile CRUD.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()


class BusinessResponse(BaseModel):
    id: UUID
    name: str
    gstin: Optional[str] = None
    state_code: str
    state_name: str
    business_type: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    pan: Optional[str] = None
    financial_year: str
    invoice_prefix: str
    created_at: datetime


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    pan: Optional[str] = None
    invoice_prefix: Optional[str] = None


@router.get("", response_model=BusinessResponse)
async def get_business(
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    return BusinessResponse(
        id=str(business.id), name=business.name, gstin=business.gstin,
        state_code=business.state_code, state_name=business.state_name,
        business_type=business.business_type, address=business.address,
        phone=business.phone, email=business.email, pan=business.pan,
        financial_year=business.financial_year, invoice_prefix=business.invoice_prefix,
        created_at=business.created_at,
    )


@router.put("", response_model=BusinessResponse)
async def update_business(
    req: BusinessUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(business, field, value)
    await db.flush()

    return BusinessResponse(
        id=str(business.id), name=business.name, gstin=business.gstin,
        state_code=business.state_code, state_name=business.state_name,
        business_type=business.business_type, address=business.address,
        phone=business.phone, email=business.email, pan=business.pan,
        financial_year=business.financial_year, invoice_prefix=business.invoice_prefix,
        created_at=business.created_at,
    )
