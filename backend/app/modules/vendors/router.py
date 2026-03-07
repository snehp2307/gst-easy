"""Vendors module — CRUD for vendor (supplier) management."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Vendor
from app.core.exceptions import NotFoundError
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


# ── Schemas ──────────────────────────────

class VendorCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None


class VendorResponse(BaseModel):
    id: str
    name: str
    gstin: Optional[str] = None
    state_code: Optional[str] = None
    state_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class VendorListResponse(BaseModel):
    vendors: List[VendorResponse]
    total: int
    page: int
    page_size: int


# ── Endpoints ─────────────────────────────

@router.get("", response_model=VendorListResponse)
async def list_vendors(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Vendor).where(Vendor.business_id == business.id, Vendor.is_active == True)
    if search:
        query = query.where(or_(
            Vendor.name.ilike(f"%{search}%"),
            Vendor.gstin.ilike(f"%{search}%"),
        ))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Vendor.name).offset(offset).limit(page_size))
    vendors = result.scalars().all()

    return VendorListResponse(
        vendors=[VendorResponse.model_validate(v, from_attributes=True) for v in vendors],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=VendorResponse, status_code=201)
async def create_vendor(
    req: VendorCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    vendor = Vendor(business_id=business.id, **req.model_dump())
    db.add(vendor)
    await db.flush()
    return VendorResponse.model_validate(vendor, from_attributes=True)


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.business_id == business.id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise NotFoundError("Vendor", str(vendor_id))
    return VendorResponse.model_validate(vendor, from_attributes=True)


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID, req: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.business_id == business.id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise NotFoundError("Vendor", str(vendor_id))
    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    await db.flush()
    return VendorResponse.model_validate(vendor, from_attributes=True)


@router.delete("/{vendor_id}", status_code=204)
async def delete_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Vendor).where(Vendor.id == vendor_id, Vendor.business_id == business.id)
    )
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise NotFoundError("Vendor", str(vendor_id))
    vendor.is_active = False
    await db.flush()
