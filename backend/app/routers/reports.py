"""
Reports API — PDF, CSV, and JSON export for GST returns.
"""
import csv
import json
from io import StringIO
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.models import Invoice, Business, User
from app.services.pdf_generator import generate_summary_pdf, generate_invoice_pdf
from app.services.gst_engine import format_paise
from app.routers.auth import get_current_user

router = APIRouter()


@router.get("/invoice-pdf/{invoice_id}")
async def get_invoice_pdf(
    invoice_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate and download invoice PDF."""
    from uuid import UUID

    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    invoice = await db.get(Invoice, UUID(invoice_id))
    if not invoice or invoice.business_id != business.id:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Load items
    from app.models import InvoiceItem
    items_result = await db.execute(
        select(InvoiceItem).where(InvoiceItem.invoice_id == invoice.id).order_by(InvoiceItem.sort_order)
    )
    items = items_result.scalars().all()

    # Load party
    from app.models import Party
    party = await db.get(Party, invoice.party_id) if invoice.party_id else None

    pdf_bytes = generate_invoice_pdf(
        business={"name": business.name, "gstin": business.gstin, "state_name": business.state_name},
        buyer={
            "name": party.name if party else "Cash Customer",
            "gstin": party.gstin if party else "",
            "state_name": party.state_name if party else "",
        },
        invoice={
            "invoice_number": invoice.invoice_number,
            "invoice_date": str(invoice.invoice_date),
            "is_inter_state": invoice.is_inter_state,
            "total_taxable_value": invoice.total_taxable_value,
            "total_cgst": invoice.total_cgst,
            "total_sgst": invoice.total_sgst,
            "total_igst": invoice.total_igst,
            "total_amount": invoice.total_amount,
        },
        items=[
            {
                "description": item.description,
                "hsn_code": item.hsn_code or "",
                "quantity": item.quantity,
                "unit_price": item.unit_price,
                "taxable_value": item.taxable_value,
                "gst_rate": item.gst_rate,
                "cgst_amount": item.cgst_amount,
                "sgst_amount": item.sgst_amount,
                "igst_amount": item.igst_amount,
                "total_amount": item.total_amount,
            }
            for item in items
        ],
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{invoice.invoice_number}.pdf"'},
    )


@router.get("/summary-pdf")
async def get_summary_pdf(
    period: str = Query(description="YYYY-MM"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Generate GST summary report PDF."""
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    # Get invoices
    sales_q = select(Invoice).where(and_(
        Invoice.business_id == business.id, Invoice.invoice_type == "sale", Invoice.filing_period == period
    ))
    purchases_q = select(Invoice).where(and_(
        Invoice.business_id == business.id, Invoice.invoice_type == "purchase", Invoice.filing_period == period
    ))

    sales = (await db.execute(sales_q)).scalars().all()
    purchases = (await db.execute(purchases_q)).scalars().all()

    # Build summary
    summary = {
        "output_cgst": sum(s.total_cgst for s in sales),
        "output_sgst": sum(s.total_sgst for s in sales),
        "output_igst": sum(s.total_igst for s in sales),
        "output_total": sum(s.total_cgst + s.total_sgst + s.total_igst for s in sales),
        "itc_cgst": sum(p.total_cgst for p in purchases),
        "itc_sgst": sum(p.total_sgst for p in purchases),
        "itc_igst": sum(p.total_igst for p in purchases),
        "itc_total": sum(p.total_cgst + p.total_sgst + p.total_igst for p in purchases),
        "net_cgst": sum(s.total_cgst for s in sales) - sum(p.total_cgst for p in purchases),
        "net_sgst": sum(s.total_sgst for s in sales) - sum(p.total_sgst for p in purchases),
        "net_igst": sum(s.total_igst for s in sales) - sum(p.total_igst for p in purchases),
        "net_total": (sum(s.total_cgst + s.total_sgst + s.total_igst for s in sales)
                      - sum(p.total_cgst + p.total_sgst + p.total_igst for p in purchases)),
    }

    pdf_bytes = generate_summary_pdf(
        business={"name": business.name, "gstin": business.gstin},
        period=period,
        summary=summary,
        sales=[{"invoice_date": str(s.invoice_date), "party_name": "", "total_taxable_value": s.total_taxable_value,
                "total_cgst": s.total_cgst, "total_sgst": s.total_sgst, "total_igst": s.total_igst,
                "total_amount": s.total_amount} for s in sales],
        purchases=[{"invoice_date": str(p.invoice_date), "party_name": "", "total_taxable_value": p.total_taxable_value,
                    "total_cgst": p.total_cgst, "total_sgst": p.total_sgst, "total_igst": p.total_igst,
                    "total_amount": p.total_amount} for p in purchases],
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="GST_Summary_{period}.pdf"'},
    )


@router.get("/csv")
async def export_csv(
    period: str = Query(description="YYYY-MM"),
    invoice_type: str = "sale",
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Export invoices as CSV."""
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    invoices_q = select(Invoice).where(and_(
        Invoice.business_id == business.id, Invoice.invoice_type == invoice_type, Invoice.filing_period == period
    ))
    invoices = (await db.execute(invoices_q)).scalars().all()

    output = StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Invoice Number", "Date", "Taxable Value", "CGST", "SGST", "IGST",
        "Total Amount", "Payment Status", "Filing Period"
    ])
    for inv in invoices:
        writer.writerow([
            inv.invoice_number, str(inv.invoice_date),
            format_paise(inv.total_taxable_value),
            format_paise(inv.total_cgst), format_paise(inv.total_sgst), format_paise(inv.total_igst),
            format_paise(inv.total_amount), inv.payment_status, inv.filing_period,
        ])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{invoice_type}s_{period}.csv"'},
    )


@router.get("/json")
async def export_json(
    period: str = Query(description="YYYY-MM"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Export GST return draft as JSON (compatible with GST portal structure)."""
    biz_result = await db.execute(select(Business).where(Business.user_id == user.id))
    business = biz_result.scalar_one_or_none()
    if not business:
        raise HTTPException(status_code=400, detail="Business profile not set up")

    sales = (await db.execute(
        select(Invoice).where(and_(
            Invoice.business_id == business.id, Invoice.invoice_type == "sale", Invoice.filing_period == period
        ))
    )).scalars().all()

    purchases = (await db.execute(
        select(Invoice).where(and_(
            Invoice.business_id == business.id, Invoice.invoice_type == "purchase", Invoice.filing_period == period
        ))
    )).scalars().all()

    draft = {
        "gstin": business.gstin,
        "period": period,
        "return_type": "GSTR3B_DRAFT",
        "generated_at": datetime.now().isoformat(),
        "gstr1_b2b": [
            {
                "invoice_number": s.invoice_number,
                "invoice_date": str(s.invoice_date),
                "taxable_value": s.total_taxable_value,
                "cgst": s.total_cgst,
                "sgst": s.total_sgst,
                "igst": s.total_igst,
                "total": s.total_amount,
                "pos": s.place_of_supply,
            }
            for s in sales if s.is_inter_state
        ],
        "gstr1_b2c": [
            {
                "invoice_number": s.invoice_number,
                "taxable_value": s.total_taxable_value,
                "cgst": s.total_cgst,
                "sgst": s.total_sgst,
                "total": s.total_amount,
            }
            for s in sales if not s.is_inter_state
        ],
        "gstr3b_summary": {
            "output_tax": {
                "cgst": sum(s.total_cgst for s in sales),
                "sgst": sum(s.total_sgst for s in sales),
                "igst": sum(s.total_igst for s in sales),
            },
            "itc_claimed": {
                "cgst": sum(p.total_cgst for p in purchases if p.itc_status == "eligible"),
                "sgst": sum(p.total_sgst for p in purchases if p.itc_status == "eligible"),
                "igst": sum(p.total_igst for p in purchases if p.itc_status == "eligible"),
            },
        },
        "disclaimer": "This is a system-generated draft. Verify before filing.",
    }

    return Response(
        content=json.dumps(draft, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="GST_Draft_{period}.json"'},
    )
