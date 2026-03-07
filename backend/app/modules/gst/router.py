"""
GST Center module — Tax compliance, GSTIN validation, filing deadlines.
Powers the GST Center UI screen.
"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice
from app.services.validation import validate_gstin
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


# ── Schemas ──────────────────────────────

class GstSummaryCard(BaseModel):
    cgst_payable: int  # paise
    sgst_payable: int
    igst_payable: int
    input_tax_credit: int


class GstValidationResult(BaseModel):
    gstin: str
    valid: bool
    results: List[dict]


class GstSummaryResponse(BaseModel):
    period: str
    output_gst: dict
    itc: dict
    net_payable: dict
    itc_carryforward: int
    sales_count: int
    purchases_count: int
    total_taxable_sales: int
    total_taxable_purchases: int
    explanation: List[str]
    return_status: str


# ── Endpoints ─────────────────────────────

@router.get("/summary-cards", response_model=GstSummaryCard)
async def gst_summary_cards(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    biz_id = business.id

    # Output GST (sales)
    sales_gst = await db.execute(
        select(
            func.coalesce(func.sum(Invoice.total_cgst), 0),
            func.coalesce(func.sum(Invoice.total_sgst), 0),
            func.coalesce(func.sum(Invoice.total_igst), 0),
        ).where(Invoice.business_id == biz_id, Invoice.invoice_type == "sale")
    )
    s_cgst, s_sgst, s_igst = sales_gst.one()

    # ITC (purchases)
    purchase_gst = await db.execute(
        select(
            func.coalesce(func.sum(Invoice.total_cgst + Invoice.total_sgst + Invoice.total_igst), 0),
        ).where(Invoice.business_id == biz_id, Invoice.invoice_type == "purchase")
    )
    itc = purchase_gst.scalar() or 0

    return GstSummaryCard(
        cgst_payable=s_cgst,
        sgst_payable=s_sgst,
        igst_payable=s_igst,
        input_tax_credit=itc,
    )


@router.post("/validate-gstin", response_model=GstValidationResult)
async def validate_gstin_endpoint(
    gstin: str,
    user: User = Depends(get_current_user),
):
    results = validate_gstin(gstin)
    valid = all(r.passed for r in results if r.severity == "critical")
    return GstValidationResult(
        gstin=gstin,
        valid=valid,
        results=[{"rule": r.rule_name, "passed": r.passed, "message": r.message} for r in results],
    )


@router.get("/summary", response_model=GstSummaryResponse)
async def gst_summary(
    period: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    from app.services.gst_engine import compute_gst_summary
    from datetime import date

    if not period:
        today = date.today()
        period = today.strftime("%Y-%m")

    summary = await compute_gst_summary(db, business.id, period)
    return summary
