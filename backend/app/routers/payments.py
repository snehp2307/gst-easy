"""
Payments API — Record payments, update invoice status.
"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models import Invoice, Payment, Business, User
from app.schemas import PaymentCreate, PaymentResponse
from app.services.audit import log_audit
from app.routers.auth import get_current_user

router = APIRouter()


@router.post("", response_model=PaymentResponse, status_code=201)
async def record_payment(
    req: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Record a payment against an invoice."""
    # Get business
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    # Get invoice
    invoice = await db.get(Invoice, UUID(req.invoice_id))
    if not invoice or invoice.business_id != business.id:
        raise HTTPException(status_code=404, detail="Invoice not found")

    if invoice.payment_status == "paid":
        raise HTTPException(status_code=400, detail="Invoice already fully paid")

    # Create payment
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
    await db.flush()

    # Calculate total paid
    paid_result = await db.execute(
        select(func.coalesce(func.sum(Payment.amount), 0))
        .where(Payment.invoice_id == invoice.id)
    )
    total_paid = paid_result.scalar() or 0

    # Update invoice status
    old_status = invoice.payment_status
    if total_paid >= invoice.total_amount:
        invoice.payment_status = "paid"
    elif total_paid > 0:
        invoice.payment_status = "partial"
    else:
        invoice.payment_status = "unpaid"

    # Audit
    await log_audit(
        db, business.id, user.id, "payment", payment.id, "create",
        changes={
            "invoice_id": str(invoice.id),
            "amount": req.amount,
            "status_change": f"{old_status} → {invoice.payment_status}",
        },
    )

    return PaymentResponse(
        id=str(payment.id),
        invoice_id=str(invoice.id),
        amount=req.amount,
        payment_date=req.payment_date,
        payment_mode=req.payment_mode,
        created_at=payment.created_at,
    )
