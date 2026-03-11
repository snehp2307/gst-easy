"""
Bills module — Purchase bill management with file upload and OCR.
"""
from uuid import UUID
from datetime import date
from fastapi import APIRouter, Depends, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice, InvoiceItem
from app.core.exceptions import NotFoundError
from app.services.gst_engine import calculate_item_gst
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class BillConfirmRequest(BaseModel):
    supplier_name: str
    supplier_gstin: Optional[str] = None
    invoice_number: str
    invoice_date: date
    taxable_value: int  # paise
    cgst_amount: int = 0
    sgst_amount: int = 0
    igst_amount: int = 0
    total_amount: int
    gst_rate: float = 18
    notes: Optional[str] = None


class OcrResult(BaseModel):
    fields: dict
    raw_text: str
    confidence: float
    confidence_score: str  # green/yellow/red


class BillResponse(BaseModel):
    id: UUID
    invoice_number: str
    invoice_date: date
    supplier_name: Optional[str] = None
    total_amount: int
    payment_status: str
    itc_status: str
    confidence_score: str
    created_at: datetime


@router.post("/upload", response_model=OcrResult)
async def upload_bill(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    from app.services.ocr import process_bill_image
    contents = await file.read()
    result = process_bill_image(contents, file.filename or "upload.jpg")
    return result


@router.post("/confirm", status_code=201)
async def confirm_bill(
    req: BillConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    is_inter = req.igst_amount > 0

    invoice = Invoice(
        business_id=business.id,
        invoice_type="purchase",
        invoice_number=req.invoice_number,
        invoice_date=req.invoice_date,
        seller_state_code="00",
        buyer_state_code=business.state_code,
        is_inter_state=is_inter,
        place_of_supply=business.state_code,
        total_taxable_value=req.taxable_value,
        total_cgst=req.cgst_amount,
        total_sgst=req.sgst_amount,
        total_igst=req.igst_amount,
        total_amount=req.total_amount,
        notes=req.notes,
        is_confirmed=True,
        itc_status="eligible",
        status="confirmed",
        created_by=user.id,
    )

    item = InvoiceItem(
        description=req.supplier_name,
        quantity=1,
        unit_price=req.taxable_value,
        taxable_value=req.taxable_value,
        gst_rate=req.gst_rate,
        cgst_amount=req.cgst_amount,
        sgst_amount=req.sgst_amount,
        igst_amount=req.igst_amount,
        total_amount=req.total_amount,
    )
    invoice.items.append(item)

    db.add(invoice)
    await db.flush()

    return {"id": str(invoice.id), "itc_status": invoice.itc_status, "confidence_score": invoice.confidence_score}


@router.get("")
async def list_bills(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Invoice).where(
        Invoice.business_id == business.id, Invoice.invoice_type == "purchase"
    )
    total = (await db.execute(select(func.count()).select_from(query.subquery()))).scalar() or 0
    offset = (page - 1) * page_size
    result = await db.execute(query.order_by(Invoice.invoice_date.desc()).offset(offset).limit(page_size))
    bills = result.scalars().all()

    return {
        "bills": [
            BillResponse(
                id=str(b.id), invoice_number=b.invoice_number, invoice_date=b.invoice_date,
                supplier_name=None, total_amount=b.total_amount,
                payment_status=b.payment_status, itc_status=b.itc_status,
                confidence_score=b.confidence_score, created_at=b.created_at,
            ) for b in bills
        ],
        "total": total,
    }
