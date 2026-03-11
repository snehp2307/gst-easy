from uuid import UUID
"""
Analytics module — Dashboard summary, charts, and tax filing status.
Powers the GSTFlow Dashboard UI screen.
"""
from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


# ── Schemas ──────────────────────────────

class DashboardSummary(BaseModel):
    total_revenue: int  # paise
    total_expenses: int
    gst_payable: int
    outstanding_payments: int
    revenue_change_pct: float
    expenses_change_pct: float
    gst_change_pct: float
    outstanding_change_pct: float


class MonthlyRevenue(BaseModel):
    month: str
    revenue: int  # paise


class ChartsResponse(BaseModel):
    monthly_revenue: List[MonthlyRevenue]


class FilingDeadline(BaseModel):
    name: str
    description: str
    due_date: str
    status: str  # filed / pending / overdue
    progress: int  # 0-100


class TaxFilingStatus(BaseModel):
    deadlines: List[FilingDeadline]


class RecentInvoice(BaseModel):
    id: UUID
    invoice_number: str
    customer_name: Optional[str]
    invoice_date: date
    total_amount: int
    status: str


# ── Endpoints ─────────────────────────────

@router.get("/summary", response_model=DashboardSummary)
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    biz_id = business.id

    # Total revenue (all sales invoices)
    rev = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.business_id == biz_id, Invoice.invoice_type == "sale"
        )
    )
    total_revenue = rev.scalar() or 0

    # Total expenses (all purchase invoices)
    exp = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.business_id == biz_id, Invoice.invoice_type == "purchase"
        )
    )
    total_expenses = exp.scalar() or 0

    # GST payable (output GST on sales)
    gst = await db.execute(
        select(
            func.coalesce(func.sum(Invoice.total_cgst + Invoice.total_sgst + Invoice.total_igst), 0)
        ).where(Invoice.business_id == biz_id, Invoice.invoice_type == "sale")
    )
    gst_payable = gst.scalar() or 0

    # Outstanding payments
    outstanding = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.business_id == biz_id, Invoice.invoice_type == "sale",
            Invoice.payment_status.in_(["unpaid", "overdue", "partially_paid"]),
        )
    )
    outstanding_payments = outstanding.scalar() or 0

    return DashboardSummary(
        total_revenue=total_revenue,
        total_expenses=total_expenses,
        gst_payable=gst_payable,
        outstanding_payments=outstanding_payments,
        revenue_change_pct=0.0,
        expenses_change_pct=0.0,
        gst_change_pct=0.0,
        outstanding_change_pct=0.0,
    )


@router.get("/charts", response_model=ChartsResponse)
async def dashboard_charts(
    months: int = Query(6, ge=1, le=12),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    results = []
    today = date.today()

    for i in range(months - 1, -1, -1):
        # Calculate month
        month_date = today.replace(day=1) - timedelta(days=30 * i)
        year = month_date.year
        month = month_date.month

        rev = await db.execute(
            select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
                Invoice.business_id == business.id,
                Invoice.invoice_type == "sale",
                extract("year", Invoice.invoice_date) == year,
                extract("month", Invoice.invoice_date) == month,
            )
        )
        revenue = rev.scalar() or 0
        month_name = month_date.strftime("%b")
        results.append(MonthlyRevenue(month=month_name, revenue=revenue))

    return ChartsResponse(monthly_revenue=results)


@router.get("/tax-filing-status", response_model=TaxFilingStatus)
async def tax_filing_status(
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    today = date.today()
    month_name = today.strftime("%B")

    return TaxFilingStatus(deadlines=[
        FilingDeadline(
            name="GSTR-1",
            description="Outward Supplies",
            due_date=f"11 {month_name} {today.year}",
            status="pending",
            progress=75,
        ),
        FilingDeadline(
            name="GSTR-3B",
            description="Monthly Summary",
            due_date=f"20 {month_name} {today.year}",
            status="pending",
            progress=0,
        ),
        FilingDeadline(
            name="IFF",
            description="Quarterly QRMP",
            due_date=f"13 {month_name} {today.year}",
            status="upcoming",
            progress=0,
        ),
    ])


@router.get("/recent-invoices", response_model=List[RecentInvoice])
async def recent_invoices(
    limit: int = Query(5, ge=1, le=20),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.customer))
        .where(Invoice.business_id == business.id, Invoice.invoice_type == "sale")
        .order_by(Invoice.created_at.desc())
        .limit(limit)
    )
    invoices = result.scalars().all()

    return [
        RecentInvoice(
            id=str(inv.id),
            invoice_number=inv.invoice_number,
            customer_name=inv.customer.name if inv.customer else None,
            invoice_date=inv.invoice_date,
            total_amount=inv.total_amount,
            status=inv.payment_status,
        )
        for inv in invoices
    ]
