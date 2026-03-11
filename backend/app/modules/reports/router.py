"""
Reports module — PDF, CSV, JSON export for invoices and GST reports.
"""
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user, get_current_business
from app.models import User, Business, Invoice
from app.services.pdf_generator import generate_invoice_pdf, generate_summary_pdf
import io
import csv
import json

router = APIRouter()


@router.get("/invoice-pdf/{invoice_id}")
async def get_invoice_pdf(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    from uuid import UUID
    from sqlalchemy.orm import selectinload
    from app.core.exceptions import NotFoundError

    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == UUID(invoice_id), Invoice.business_id == business.id)
    )
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise NotFoundError("Invoice", invoice_id)

    pdf_bytes = generate_invoice_pdf(invoice, business)
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={invoice.invoice_number}.pdf"},
    )


@router.get("/csv")
async def export_csv(
    period: str = Query(None),
    invoice_type: str = Query("sale"),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Invoice).where(
        Invoice.business_id == business.id,
        Invoice.invoice_type == invoice_type,
    )
    if period:
        query = query.where(Invoice.filing_period == period)

    result = await db.execute(query.order_by(Invoice.invoice_date))
    invoices = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Invoice #", "Date", "Taxable", "CGST", "SGST", "IGST", "Total", "Status"])
    for inv in invoices:
        writer.writerow([
            inv.invoice_number, str(inv.invoice_date),
            inv.total_taxable_value, inv.total_cgst, inv.total_sgst,
            inv.total_igst, inv.total_amount, inv.payment_status,
        ])

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=invoices_{invoice_type}.csv"},
    )


@router.get("/json")
async def export_json(
    period: str = Query(None),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
    business: Business = Depends(get_current_business),
):
    query = select(Invoice).where(Invoice.business_id == business.id)
    if period:
        query = query.where(Invoice.filing_period == period)

    result = await db.execute(query.order_by(Invoice.invoice_date))
    invoices = result.scalars().all()

    data = [
        {
            "invoice_number": inv.invoice_number,
            "date": str(inv.invoice_date),
            "type": inv.invoice_type,
            "taxable": inv.total_taxable_value,
            "cgst": inv.total_cgst,
            "sgst": inv.total_sgst,
            "igst": inv.total_igst,
            "total": inv.total_amount,
            "status": inv.payment_status,
        }
        for inv in invoices
    ]

    return StreamingResponse(
        io.BytesIO(json.dumps(data, indent=2).encode()),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=export.json"},
    )
