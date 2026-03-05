"""
GST Summary API — Monthly summary, ITC cross-utilization, explanation.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models import Invoice, Business, User
from app.schemas import GstSummaryResponse, GstBreakupResponse
from app.services.gst_engine import (
    GstBreakup, calculate_net_payable, generate_explanation, format_paise,
)
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/summary", response_model=GstSummaryResponse)
async def get_gst_summary(
    period: str = Query(default=None, description="YYYY-MM format"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Get GST summary for a period with ITC cross-utilization."""
    # Default to current month
    if not period:
        period = datetime.now().strftime("%Y-%m")

    # Get business
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    biz_id = business.id

    # ── Output GST (from sales) ──
    sales_q = select(
        func.count(Invoice.id).label("count"),
        func.coalesce(func.sum(Invoice.total_taxable_value), 0).label("taxable"),
        func.coalesce(func.sum(Invoice.total_cgst), 0).label("cgst"),
        func.coalesce(func.sum(Invoice.total_sgst), 0).label("sgst"),
        func.coalesce(func.sum(Invoice.total_igst), 0).label("igst"),
    ).where(
        and_(
            Invoice.business_id == biz_id,
            Invoice.invoice_type == "sale",
            Invoice.filing_period == period,
        )
    )
    sales_result = (await db.execute(sales_q)).one()
    sales_count = sales_result.count
    output = GstBreakup(
        cgst=int(sales_result.cgst),
        sgst=int(sales_result.sgst),
        igst=int(sales_result.igst),
    )

    # ── ITC (from confirmed purchases) ──
    purchases_q = select(
        func.count(Invoice.id).label("count"),
        func.coalesce(func.sum(Invoice.total_taxable_value), 0).label("taxable"),
        func.coalesce(func.sum(Invoice.total_cgst), 0).label("cgst"),
        func.coalesce(func.sum(Invoice.total_sgst), 0).label("sgst"),
        func.coalesce(func.sum(Invoice.total_igst), 0).label("igst"),
    ).where(
        and_(
            Invoice.business_id == biz_id,
            Invoice.invoice_type == "purchase",
            Invoice.filing_period == period,
            Invoice.is_confirmed == True,
        )
    )
    pur_result = (await db.execute(purchases_q)).one()
    purchases_count = pur_result.count
    itc = GstBreakup(
        cgst=int(pur_result.cgst),
        sgst=int(pur_result.sgst),
        igst=int(pur_result.igst),
    )

    # Eligible ITC (exclude blocked/needs_review)
    eligible_q = select(
        func.coalesce(func.sum(Invoice.total_cgst + Invoice.total_sgst + Invoice.total_igst), 0),
    ).where(
        and_(
            Invoice.business_id == biz_id,
            Invoice.invoice_type == "purchase",
            Invoice.filing_period == period,
            Invoice.is_confirmed == True,
            Invoice.itc_status == "eligible",
        )
    )
    eligible_itc = int((await db.execute(eligible_q)).scalar() or 0)

    # ── Cross-utilization ──
    net = calculate_net_payable(output, itc)

    # ── Explanation ──
    explanation = generate_explanation(
        output, itc, net, sales_count, purchases_count, eligible_itc,
    )

    return GstSummaryResponse(
        period=period,
        output_gst=GstBreakupResponse(
            cgst=output.cgst, sgst=output.sgst, igst=output.igst, total=output.total
        ),
        itc=GstBreakupResponse(
            cgst=itc.cgst, sgst=itc.sgst, igst=itc.igst, total=itc.total
        ),
        net_payable=GstBreakupResponse(
            cgst=net.cgst, sgst=net.sgst, igst=net.igst, total=net.total
        ),
        itc_carryforward=net.itc_carryforward,
        sales_count=sales_count,
        purchases_count=purchases_count,
        total_taxable_sales=int(sales_result.taxable),
        total_taxable_purchases=int(pur_result.taxable),
        explanation=explanation,
        return_status="draft",
    )
