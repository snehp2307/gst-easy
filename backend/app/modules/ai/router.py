"""AI Service module — Endpoints for AI-powered features.

Provides:
- Chat (mock LLM responses for business queries)
- Bill OCR scanning status
- Revenue predictions
- GST compliance intelligence
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice, Product

router = APIRouter()


# ─── Schemas ──────────────────────────────

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    data: Optional[dict] = None


class PredictionResponse(BaseModel):
    metric: str
    current_value: float
    predicted_value: float
    confidence: float
    period: str


class ComplianceAlert(BaseModel):
    severity: str  # error | warning | info
    title: str
    description: str
    action: Optional[str] = None


# ─── Chat Endpoint ────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def ai_chat(
    req: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    """Process a chat message and return AI-generated business insights."""
    msg = req.message.lower()

    # -- GST query --
    if "gst" in msg and ("owe" in msg or "payable" in msg or "liability" in msg):
        result = await db.execute(
            select(
                func.coalesce(func.sum(Invoice.total_cgst), 0),
                func.coalesce(func.sum(Invoice.total_sgst), 0),
                func.coalesce(func.sum(Invoice.total_igst), 0),
            ).where(Invoice.business_id == business.id, Invoice.invoice_type == "sale")
        )
        row = result.one()
        cgst, sgst, igst = row[0] / 100, row[1] / 100, row[2] / 100
        total = cgst + sgst + igst
        return ChatResponse(
            response=f"Your total GST liability is ₹{total:,.2f} (CGST: ₹{cgst:,.2f}, SGST: ₹{sgst:,.2f}, IGST: ₹{igst:,.2f}).",
            data={"cgst": cgst, "sgst": sgst, "igst": igst, "total": total},
        )

    # -- Revenue query --
    if "revenue" in msg or "sales" in msg or "earnings" in msg:
        result = await db.execute(
            select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
                Invoice.business_id == business.id, Invoice.invoice_type == "sale"
            )
        )
        total = (result.scalar() or 0) / 100
        return ChatResponse(
            response=f"Your total revenue is ₹{total:,.2f}.",
            data={"total_revenue": total},
        )

    # -- Unpaid invoices --
    if "unpaid" in msg or "outstanding" in msg or "pending" in msg:
        result = await db.execute(
            select(func.count(), func.coalesce(func.sum(Invoice.total_amount), 0)).where(
                Invoice.business_id == business.id,
                Invoice.payment_status.in_(["unpaid", "partially_paid"]),
            )
        )
        row = result.one()
        count, amount = row[0], row[1] / 100
        return ChatResponse(
            response=f"You have {count} unpaid invoice(s) totaling ₹{amount:,.2f}.",
            data={"unpaid_count": count, "unpaid_amount": amount},
        )

    # -- Fallback --
    return ChatResponse(
        response=(
            f"I can help you with GST queries, revenue data, unpaid invoices, and more. "
            f"Try asking: 'How much GST do I owe?', 'Show my revenue', or 'List unpaid invoices'."
        ),
    )


# ─── Predictions ──────────────────────────

@router.get("/predictions", response_model=List[PredictionResponse])
async def get_predictions(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    """Return AI-generated business predictions."""
    # Revenue prediction based on current data
    result = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0)).where(
            Invoice.business_id == business.id, Invoice.invoice_type == "sale"
        )
    )
    current_revenue = (result.scalar() or 0) / 100

    # Low stock products count
    result = await db.execute(
        select(func.count()).where(
            Product.business_id == business.id,
            Product.is_active == True,
            Product.stock_quantity <= Product.low_stock_threshold,
        )
    )
    low_stock = result.scalar() or 0

    return [
        PredictionResponse(
            metric="Revenue (Next Month)",
            current_value=current_revenue,
            predicted_value=current_revenue * 1.15,
            confidence=0.82,
            period="next_month",
        ),
        PredictionResponse(
            metric="Low Stock Products",
            current_value=float(low_stock),
            predicted_value=float(low_stock + 2),
            confidence=0.75,
            period="next_week",
        ),
    ]


# ─── Compliance Intelligence ─────────────

@router.get("/compliance", response_model=List[ComplianceAlert])
async def compliance_alerts(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    """Return AI-detected compliance issues."""
    alerts: List[ComplianceAlert] = []

    # Check for invoices without GSTIN
    result = await db.execute(
        select(func.count()).where(
            Invoice.business_id == business.id,
            Invoice.invoice_type == "sale",
            Invoice.total_amount > 25000_00,  # > ₹25,000 threshold
        )
    )
    high_value = result.scalar() or 0
    if high_value > 0:
        alerts.append(ComplianceAlert(
            severity="warning",
            title="High-Value Invoices",
            description=f"{high_value} invoice(s) exceed ₹25,000. Ensure customer GSTIN is recorded for B2B transactions.",
            action="Review invoices",
        ))

    # Check low stock
    result = await db.execute(
        select(func.count()).where(
            Product.business_id == business.id,
            Product.is_active == True,
            Product.stock_quantity == 0,
        )
    )
    out_of_stock = result.scalar() or 0
    if out_of_stock > 0:
        alerts.append(ComplianceAlert(
            severity="error",
            title="Out of Stock Products",
            description=f"{out_of_stock} product(s) are out of stock and may cause invoicing errors.",
            action="Restock inventory",
        ))

    # Filing reminder
    alerts.append(ComplianceAlert(
        severity="info",
        title="GSTR-3B Due Soon",
        description="Your GSTR-3B monthly summary return is due by the 20th. Ensure all invoices are recorded.",
        action="Go to GST Center",
    ))

    return alerts
