"""
Bills API — Upload purchase bills, OCR extraction, confirm/save.
"""
from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models import Invoice, InvoiceItem, Party, Business, User
from app.schemas import BillConfirmRequest, OcrResult
from app.services.ocr import (
    extract_text_from_image, extract_bill_fields,
    compute_ocr_confidence_score, compress_image, create_thumbnail,
)
from app.services.gst_engine import is_inter_state, to_paise
from app.services.validation import validate_gstin, compute_confidence
from app.services.audit import log_audit
from app.routers.auth import get_current_user

router = APIRouter()


@router.post("/upload", response_model=OcrResult)
async def upload_bill(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Upload a purchase bill image/PDF.
    1. Compress image
    2. Run OCR
    3. Extract fields
    4. Return for user confirmation
    """
    # Validate file type
    allowed = {"image/jpeg", "image/png", "image/jpg", "application/pdf"}
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not supported. Use JPG, PNG, or PDF.")

    # Read file
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:  # 10MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 10MB.")

    # Compress image
    if file.content_type != "application/pdf":
        compressed = compress_image(content)
    else:
        compressed = content  # PDF: store as-is for now

    # Run OCR
    raw_text = extract_text_from_image(content)
    fields, confidence = extract_bill_fields(raw_text)
    score = compute_ocr_confidence_score(confidence)

    # In production: upload to storage
    # url = await upload_file(compressed, file.filename, file.content_type)
    # thumbnail_url = await upload_file(create_thumbnail(content), f"thumb_{file.filename}")

    return OcrResult(
        fields=fields,
        raw_text=raw_text[:2000],  # Truncate raw text
        confidence=round(confidence, 1),
        confidence_score=score,
    )


@router.post("/confirm")
async def confirm_bill(
    req: BillConfirmRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """
    Confirm extracted bill data and save as purchase invoice.
    User has reviewed and corrected OCR output.
    """
    # Get business
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    # Determine inter-state
    supplier_state = req.supplier_gstin[:2] if req.supplier_gstin and len(req.supplier_gstin) >= 2 else business.state_code
    inter_state = is_inter_state(business.state_code, supplier_state)

    # Validate GSTIN
    validations = validate_gstin(req.supplier_gstin or "")
    confidence = compute_confidence(validations)

    # ITC classification
    if confidence == "green":
        itc_status = "eligible"
    elif confidence == "yellow":
        itc_status = "needs_review"
    else:
        itc_status = "blocked"

    # Find or create supplier party
    party = None
    party_q = select(Party).where(
        and_(Party.business_id == business.id, Party.name == req.supplier_name)
    )
    party_result = await db.execute(party_q)
    party = party_result.scalar_one_or_none()
    if not party:
        party = Party(
            business_id=business.id,
            name=req.supplier_name,
            gstin=req.supplier_gstin,
            state_code=supplier_state,
            party_type="supplier",
        )
        db.add(party)
        await db.flush()

    # Filing period
    period = req.invoice_date.strftime("%Y-%m")

    # Create purchase invoice
    invoice = Invoice(
        business_id=business.id,
        party_id=party.id,
        invoice_type="purchase",
        invoice_number=req.invoice_number,
        invoice_date=req.invoice_date,
        seller_state_code=supplier_state,
        buyer_state_code=business.state_code,
        is_inter_state=inter_state,
        place_of_supply=business.state_code,
        total_taxable_value=req.taxable_value,
        total_cgst=req.cgst_amount,
        total_sgst=req.sgst_amount,
        total_igst=req.igst_amount,
        total_amount=req.total_amount,
        confidence_score=confidence,
        itc_status=itc_status,
        is_confirmed=True,
        filing_period=period,
        notes=req.notes,
        created_by=user.id,
    )
    db.add(invoice)
    await db.flush()

    # Create single line item for the bill
    item = InvoiceItem(
        invoice_id=invoice.id,
        description="Purchase bill",
        quantity=1,
        unit_price=req.taxable_value,
        taxable_value=req.taxable_value,
        gst_rate=req.gst_rate,
        cgst_rate=req.gst_rate / 2 if not inter_state else 0,
        sgst_rate=req.gst_rate / 2 if not inter_state else 0,
        igst_rate=req.gst_rate if inter_state else 0,
        cgst_amount=req.cgst_amount,
        sgst_amount=req.sgst_amount,
        igst_amount=req.igst_amount,
        total_amount=req.total_amount,
    )
    db.add(item)

    # Audit
    await log_audit(
        db, business.id, user.id, "invoice", invoice.id, "create",
        changes={"type": "purchase", "supplier": req.supplier_name, "total": req.total_amount},
    )

    return {
        "id": str(invoice.id),
        "invoice_number": req.invoice_number,
        "supplier": req.supplier_name,
        "total_amount": req.total_amount,
        "itc_status": itc_status,
        "confidence_score": confidence,
    }
