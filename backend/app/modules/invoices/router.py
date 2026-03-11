"""
Invoices module — Full CRUD with line items, GST calculation, PDF download.
Supports the Create Invoice and Invoice Management UI screens.
"""
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice, InvoiceItem, Customer
from app.core.exceptions import NotFoundError
from app.services.gst_engine import calculate_item_gst
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

router = APIRouter()


# ── Schemas ──────────────────────────────

class InvoiceItemCreate(BaseModel):
    description: str
    hsn_code: Optional[str] = None
    quantity: float = 1
    unit_price: int  # paise
    gst_rate: float
    discount: int = 0


class InvoiceCreate(BaseModel):
    customer_id: Optional[str] = None
    buyer_name: Optional[str] = None
    buyer_gstin: Optional[str] = None
    buyer_state_code: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: str = "draft"


class InvoiceItemResponse(BaseModel):
    id: UUID
    description: str
    hsn_code: Optional[str] = None
    quantity: float
    unit_price: int
    taxable_value: int
    gst_rate: float
    cgst_amount: int
    sgst_amount: int
    igst_amount: int
    total_amount: int

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: UUID
    invoice_type: str
    invoice_number: str
    invoice_date: date
    due_date: Optional[date] = None
    status: str
    customer_name: Optional[str] = None
    customer_gstin: Optional[str] = None
    is_inter_state: bool
    total_taxable_value: int
    total_cgst: int
    total_sgst: int
    total_igst: int
    total_amount: int
    payment_status: str
    confidence_score: str
    items: Optional[List[InvoiceItemResponse]] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


class InvoiceStatsResponse(BaseModel):
    total_collected: int
    outstanding: int
    gst_liability: int


# ── Endpoints ─────────────────────────────

@router.get("/stats", response_model=InvoiceStatsResponse)
async def get_invoice_stats(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    base = select(Invoice).where(
        Invoice.business_id == business.id, Invoice.invoice_type == "sale"
    )

    # Total collected (paid invoices)
    paid = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.business_id == business.id, Invoice.invoice_type == "sale",
            Invoice.payment_status == "paid",
        )
    )
    total_collected = paid.scalar() or 0

    # Outstanding (unpaid + overdue)
    outstanding_q = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.business_id == business.id, Invoice.invoice_type == "sale",
            Invoice.payment_status.in_(["unpaid", "overdue", "partially_paid"]),
        )
    )
    outstanding = outstanding_q.scalar() or 0

    # GST liability
    gst_q = await db.execute(
        select(
            func.coalesce(func.sum(Invoice.total_cgst + Invoice.total_sgst + Invoice.total_igst), 0)
        ).where(Invoice.business_id == business.id, Invoice.invoice_type == "sale")
    )
    gst_liability = gst_q.scalar() or 0

    return InvoiceStatsResponse(
        total_collected=total_collected,
        outstanding=outstanding,
        gst_liability=gst_liability,
    )


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    invoice_type: str = Query("sale"),
    payment_status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Invoice).where(
        Invoice.business_id == business.id,
        Invoice.invoice_type == invoice_type,
    )

    if payment_status:
        query = query.where(Invoice.payment_status == payment_status)
    if search:
        query = query.where(or_(
            Invoice.invoice_number.ilike(f"%{search}%"),
        ))

    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    offset = (page - 1) * page_size
    result = await db.execute(
        query.options(selectinload(Invoice.customer))
        .order_by(Invoice.invoice_date.desc())
        .offset(offset).limit(page_size)
    )
    invoices = result.scalars().all()

    items = []
    for inv in invoices:
        resp = InvoiceResponse(
            id=str(inv.id),
            invoice_type=inv.invoice_type,
            invoice_number=inv.invoice_number,
            invoice_date=inv.invoice_date,
            due_date=inv.due_date,
            status=inv.status,
            customer_name=inv.customer.name if inv.customer else None,
            customer_gstin=inv.customer.gstin if inv.customer else None,
            is_inter_state=inv.is_inter_state,
            total_taxable_value=inv.total_taxable_value,
            total_cgst=inv.total_cgst,
            total_sgst=inv.total_sgst,
            total_igst=inv.total_igst,
            total_amount=inv.total_amount,
            payment_status=inv.payment_status,
            confidence_score=inv.confidence_score,
            notes=inv.notes,
            terms=inv.terms,
            created_at=inv.created_at,
        )
        items.append(resp)

    return InvoiceListResponse(invoices=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    req: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    # Resolve customer
    buyer_state = req.buyer_state_code or business.state_code
    if req.customer_id:
        cust_result = await db.execute(
            select(Customer).where(Customer.id == req.customer_id, Customer.business_id == business.id)
        )
        cust = cust_result.scalar_one_or_none()
        if cust:
            buyer_state = cust.state_code or buyer_state

    is_inter = business.state_code != buyer_state

    # Generate invoice number
    inv_number = f"{business.invoice_prefix}{business.next_invoice_no}"
    business.next_invoice_no += 1

    invoice = Invoice(
        business_id=business.id,
        customer_id=req.customer_id if req.customer_id else None,
        invoice_type="sale",
        invoice_number=inv_number,
        invoice_date=req.invoice_date,
        due_date=req.due_date,
        status=req.status,
        seller_state_code=business.state_code,
        buyer_state_code=buyer_state,
        is_inter_state=is_inter,
        place_of_supply=buyer_state,
        notes=req.notes,
        terms=req.terms,
        created_by=user.id,
    )

    total_taxable = 0
    total_cgst = 0
    total_sgst = 0
    total_igst = 0

    for item_data in req.items:
        gst = calculate_item_gst(
            unit_price=item_data.unit_price,
            quantity=item_data.quantity,
            discount=item_data.discount,
            gst_rate=item_data.gst_rate,
            is_inter_state=is_inter,
        )

        item = InvoiceItem(
            description=item_data.description,
            hsn_code=item_data.hsn_code,
            quantity=item_data.quantity,
            unit_price=item_data.unit_price,
            discount=item_data.discount,
            taxable_value=gst["taxable_value"],
            gst_rate=item_data.gst_rate,
            cgst_rate=gst["cgst_rate"],
            sgst_rate=gst["sgst_rate"],
            igst_rate=gst["igst_rate"],
            cgst_amount=gst["cgst_amount"],
            sgst_amount=gst["sgst_amount"],
            igst_amount=gst["igst_amount"],
            total_amount=gst["total_amount"],
        )
        invoice.items.append(item)

        total_taxable += gst["taxable_value"]
        total_cgst += gst["cgst_amount"]
        total_sgst += gst["sgst_amount"]
        total_igst += gst["igst_amount"]

    invoice.total_taxable_value = total_taxable
    invoice.total_cgst = total_cgst
    invoice.total_sgst = total_sgst
    invoice.total_igst = total_igst
    invoice.total_amount = total_taxable + total_cgst + total_sgst + total_igst

    db.add(invoice)
    await db.flush()

    return InvoiceResponse(
        id=str(invoice.id),
        invoice_type=invoice.invoice_type,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        status=invoice.status,
        customer_name=req.buyer_name,
        is_inter_state=invoice.is_inter_state,
        total_taxable_value=invoice.total_taxable_value,
        total_cgst=invoice.total_cgst,
        total_sgst=invoice.total_sgst,
        total_igst=invoice.total_igst,
        total_amount=invoice.total_amount,
        payment_status=invoice.payment_status,
        confidence_score=invoice.confidence_score,
        created_at=invoice.created_at,
    )


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items), selectinload(Invoice.customer))
        .where(Invoice.id == invoice_id, Invoice.business_id == business.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise NotFoundError("Invoice", str(invoice_id))

    return InvoiceResponse(
        id=str(invoice.id),
        invoice_type=invoice.invoice_type,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        due_date=invoice.due_date,
        status=invoice.status,
        customer_name=invoice.customer.name if invoice.customer else None,
        customer_gstin=invoice.customer.gstin if invoice.customer else None,
        is_inter_state=invoice.is_inter_state,
        total_taxable_value=invoice.total_taxable_value,
        total_cgst=invoice.total_cgst,
        total_sgst=invoice.total_sgst,
        total_igst=invoice.total_igst,
        total_amount=invoice.total_amount,
        payment_status=invoice.payment_status,
        confidence_score=invoice.confidence_score,
        items=[InvoiceItemResponse.model_validate(i, from_attributes=True) for i in invoice.items],
        notes=invoice.notes,
        terms=invoice.terms,
        created_at=invoice.created_at,
    )
