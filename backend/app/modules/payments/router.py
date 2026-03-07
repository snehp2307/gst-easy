"""
Payments module — Record payments against invoices.
"""
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice, Payment
from app.core.exceptions import NotFoundError, BadRequestError
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class PaymentCreate(BaseModel):
    invoice_id: str
    amount: int  # paise
    payment_date: date
    payment_mode: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount: int
    payment_date: date
    payment_mode: str
    reference_number: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentListResponse(BaseModel):
    payments: List[PaymentResponse]
    total: int


@router.get("")
async def list_payments(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Payment).where(Payment.business_id == business.id)
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Payment.payment_date.desc()).offset(offset).limit(page_size))
    payments = result.scalars().all()

    return PaymentListResponse(
        payments=[PaymentResponse.model_validate(p, from_attributes=True) for p in payments],
        total=total,
    )


@router.post("", response_model=PaymentResponse, status_code=201)
async def record_payment(
    req: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    # Verify invoice belongs to this business
    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == UUID(req.invoice_id), Invoice.business_id == business.id)
    )
    invoice = inv_result.scalar_one_or_none()
    if not invoice:
        raise NotFoundError("Invoice", req.invoice_id)

    payment = Payment(
        invoice_id=invoice.id,
        business_id=business.id,
        amount=req.amount,
        payment_date=req.payment_date,
        payment_mode=req.payment_mode,
        reference_number=req.reference_number,
        notes=req.notes,
        created_by=user.id,
    )
    db.add(payment)

    # Update invoice payment status
    total_paid_q = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0)).where(Payment.invoice_id == invoice.id)
    )
    total_paid = (total_paid_q.scalar() or 0) + req.amount

    if total_paid >= invoice.total_amount:
        invoice.payment_status = "paid"
        invoice.status = "paid"
    else:
        invoice.payment_status = "partially_paid"

    await db.flush()
    return PaymentResponse.model_validate(payment, from_attributes=True)
