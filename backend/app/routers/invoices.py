"""
Invoices API — List + Create sales invoices with auto GST calculation.
"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models import Invoice, InvoiceItem, Party, Business, User
from app.schemas import InvoiceCreate, InvoiceResponse, InvoiceListResponse, InvoiceItemResponse
from app.services.gst_engine import (
    calculate_line_item_gst, calculate_invoice_totals, is_inter_state, to_paise,
)
from app.services.validation import validate_gstin, compute_confidence
from app.services.audit import log_audit
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("", response_model=InvoiceListResponse)
async def list_invoices(
    invoice_type: str = "sale",
    payment_status: str | None = None,
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=5, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """List invoices with pagination and filters."""
    # Get user's business
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        return InvoiceListResponse(invoices=[], total=0, page=page, page_size=page_size)

    # Build query
    query = select(Invoice).where(
        and_(Invoice.business_id == business.id, Invoice.invoice_type == invoice_type)
    )

    if payment_status and payment_status != "all":
        query = query.where(Invoice.payment_status == payment_status)

    if search:
        query = query.where(Invoice.invoice_number.ilike(f"%{search}%"))

    # Count
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    # Paginate
    query = query.order_by(Invoice.invoice_date.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(query)
    invoices = result.scalars().all()

    return InvoiceListResponse(
        invoices=[
            InvoiceResponse(
                id=str(inv.id),
                invoice_type=inv.invoice_type,
                invoice_number=inv.invoice_number,
                invoice_date=inv.invoice_date,
                party_name=None,  # Would join with Party table
                is_inter_state=inv.is_inter_state,
                total_taxable_value=inv.total_taxable_value,
                total_cgst=inv.total_cgst,
                total_sgst=inv.total_sgst,
                total_igst=inv.total_igst,
                total_amount=inv.total_amount,
                payment_status=inv.payment_status,
                confidence_score=inv.confidence_score,
                created_at=inv.created_at,
            )
            for inv in invoices
        ],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    req: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Create a new sales invoice with auto GST calculation."""
    # Get business
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    # Determine inter-state
    buyer_state = req.buyer_state_code or business.state_code
    if req.buyer_gstin and len(req.buyer_gstin) >= 2:
        buyer_state = req.buyer_gstin[:2]
    inter_state = is_inter_state(business.state_code, buyer_state)

    # Calculate GST for each item
    calculated_items = []
    for item in req.items:
        result = calculate_line_item_gst(
            quantity=item.quantity,
            unit_price=item.unit_price,
            gst_rate=item.gst_rate,
            inter_state=inter_state,
            discount=item.discount,
        )
        calculated_items.append(result)

    totals = calculate_invoice_totals(calculated_items)

    # Validate and score confidence
    validations = validate_gstin(req.buyer_gstin or "")
    confidence = compute_confidence(validations)

    # Find or create party
    party = None
    if req.buyer_name:
        party_q = select(Party).where(
            and_(Party.business_id == business.id, Party.name == req.buyer_name)
        )
        party_result = await db.execute(party_q)
        party = party_result.scalar_one_or_none()
        if not party:
            party = Party(
                business_id=business.id,
                name=req.buyer_name,
                gstin=req.buyer_gstin,
                state_code=buyer_state,
                party_type="customer",
            )
            db.add(party)
            await db.flush()

    # Generate invoice number
    inv_number = f"{business.invoice_prefix}{business.next_invoice_no:04d}"
    business.next_invoice_no += 1

    # Filing period
    period = req.invoice_date.strftime("%Y-%m")

    # Create invoice
    invoice = Invoice(
        business_id=business.id,
        party_id=party.id if party else None,
        invoice_type="sale",
        invoice_number=inv_number,
        invoice_date=req.invoice_date,
        due_date=req.due_date,
        seller_state_code=business.state_code,
        buyer_state_code=buyer_state,
        is_inter_state=inter_state,
        place_of_supply=buyer_state,
        total_taxable_value=totals.total_taxable_value,
        total_cgst=totals.total_cgst,
        total_sgst=totals.total_sgst,
        total_igst=totals.total_igst,
        total_amount=totals.total_amount,
        confidence_score=confidence,
        filing_period=period,
        notes=req.notes,
        created_by=user.id,
    )
    db.add(invoice)
    await db.flush()

    # Create line items
    for i, (item_req, calc) in enumerate(zip(req.items, calculated_items)):
        db_item = InvoiceItem(
            invoice_id=invoice.id,
            description=item_req.description,
            hsn_code=item_req.hsn_code,
            quantity=item_req.quantity,
            unit_price=item_req.unit_price,
            discount=item_req.discount,
            taxable_value=calc.taxable_value,
            gst_rate=item_req.gst_rate,
            cgst_rate=calc.cgst_rate,
            sgst_rate=calc.sgst_rate,
            igst_rate=calc.igst_rate,
            cgst_amount=calc.cgst_amount,
            sgst_amount=calc.sgst_amount,
            igst_amount=calc.igst_amount,
            total_amount=calc.total_amount,
            sort_order=i,
        )
        db.add(db_item)

    # Audit log
    await log_audit(
        db, business.id, user.id, "invoice", invoice.id, "create",
        changes={"invoice_number": inv_number, "total_amount": totals.total_amount},
    )

    return InvoiceResponse(
        id=str(invoice.id),
        invoice_type="sale",
        invoice_number=inv_number,
        invoice_date=req.invoice_date,
        party_name=req.buyer_name,
        party_gstin=req.buyer_gstin,
        is_inter_state=inter_state,
        total_taxable_value=totals.total_taxable_value,
        total_cgst=totals.total_cgst,
        total_sgst=totals.total_sgst,
        total_igst=totals.total_igst,
        total_amount=totals.total_amount,
        payment_status="unpaid",
        confidence_score=confidence,
        created_at=invoice.created_at,
    )
