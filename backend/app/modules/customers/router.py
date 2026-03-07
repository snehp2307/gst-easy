"""Customers module — CRUD for customer (buyer) management."""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Customer
from app.core.exceptions import NotFoundError, DuplicateError
from app.modules.customers.schemas import (
    CustomerCreate, CustomerUpdate, CustomerResponse, CustomerListResponse,
)

router = APIRouter()


@router.get("", response_model=CustomerListResponse)
async def list_customers(
    search: str = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Customer).where(Customer.business_id == business.id, Customer.is_active == True)

    if search:
        query = query.where(
            or_(
                Customer.name.ilike(f"%{search}%"),
                Customer.gstin.ilike(f"%{search}%"),
                Customer.phone.ilike(f"%{search}%"),
            )
        )

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.order_by(Customer.name).offset(offset).limit(page_size)
    result = await db.execute(query)
    customers = result.scalars().all()

    return CustomerListResponse(
        customers=[CustomerResponse.model_validate(c, from_attributes=True) for c in customers],
        total=total, page=page, page_size=page_size,
    )


@router.post("", response_model=CustomerResponse, status_code=201)
async def create_customer(
    req: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    customer = Customer(business_id=business.id, **req.model_dump())
    db.add(customer)
    await db.flush()
    return CustomerResponse.model_validate(customer, from_attributes=True)


@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.business_id == business.id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise NotFoundError("Customer", str(customer_id))
    return CustomerResponse.model_validate(customer, from_attributes=True)


@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: UUID,
    req: CustomerUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.business_id == business.id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise NotFoundError("Customer", str(customer_id))

    for field, value in req.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)

    await db.flush()
    return CustomerResponse.model_validate(customer, from_attributes=True)


@router.delete("/{customer_id}", status_code=204)
async def delete_customer(
    customer_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.business_id == business.id)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise NotFoundError("Customer", str(customer_id))
    customer.is_active = False
    await db.flush()
