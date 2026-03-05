"""
PDF generation for invoices and GST summary reports using ReportLab.
"""
from io import BytesIO
from datetime import date
from typing import List, Dict, Any, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
)
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT

from app.services.gst_engine import format_paise


# ─────────────────────────────────────────
# Invoice PDF
# ─────────────────────────────────────────

def generate_invoice_pdf(
    business: Dict[str, Any],
    buyer: Dict[str, Any],
    invoice: Dict[str, Any],
    items: List[Dict[str, Any]],
) -> bytes:
    """Generate a professional GST-compliant invoice PDF."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm,
                            leftMargin=1.5*cm, rightMargin=1.5*cm)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle("InvTitle", parent=styles["Heading1"], fontSize=16,
                                  textColor=colors.HexColor("#4F46E5"), spaceAfter=2*mm)
    label_style = ParagraphStyle("Label", parent=styles["Normal"], fontSize=8,
                                  textColor=colors.grey, spaceBefore=0, spaceAfter=1*mm)
    value_style = ParagraphStyle("Value", parent=styles["Normal"], fontSize=10,
                                  spaceBefore=0, spaceAfter=0)
    right_style = ParagraphStyle("Right", parent=styles["Normal"], fontSize=10, alignment=TA_RIGHT)

    elements = []

    # Header
    elements.append(Paragraph("TAX INVOICE", title_style))
    elements.append(Spacer(1, 3*mm))

    # Business & Buyer info — side by side
    info_data = [
        [
            Paragraph(f"<b>From:</b><br/>{business.get('name', '')}<br/>"
                     f"GSTIN: {business.get('gstin', '')}<br/>"
                     f"{business.get('state_name', '')}", value_style),
            Paragraph(f"<b>To:</b><br/>{buyer.get('name', '')}<br/>"
                     f"GSTIN: {buyer.get('gstin', 'N/A')}<br/>"
                     f"{buyer.get('state_name', '')}", value_style),
            Paragraph(f"<b>Invoice #:</b> {invoice.get('invoice_number', '')}<br/>"
                     f"<b>Date:</b> {invoice.get('invoice_date', '')}<br/>"
                     f"<b>Type:</b> {'Inter-state (IGST)' if invoice.get('is_inter_state') else 'Intra-state (CGST+SGST)'}", value_style),
        ]
    ]
    info_table = Table(info_data, colWidths=[6*cm, 6*cm, 6*cm])
    info_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 5*mm))
    elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.lightgrey))
    elements.append(Spacer(1, 3*mm))

    # Items table
    is_inter = invoice.get("is_inter_state", False)

    if is_inter:
        header = ["#", "Description", "HSN", "Qty", "Rate (₹)", "Taxable (₹)", "IGST", "Total (₹)"]
        col_widths = [0.8*cm, 5*cm, 1.8*cm, 1.2*cm, 2.2*cm, 2.5*cm, 2.5*cm, 2.5*cm]
    else:
        header = ["#", "Description", "HSN", "Qty", "Rate (₹)", "Taxable (₹)", "CGST", "SGST", "Total (₹)"]
        col_widths = [0.6*cm, 4*cm, 1.5*cm, 1*cm, 2*cm, 2.2*cm, 2*cm, 2*cm, 2.2*cm]

    table_data = [header]
    for i, item in enumerate(items, 1):
        row = [
            str(i),
            item.get("description", ""),
            item.get("hsn_code", ""),
            str(item.get("quantity", 1)),
            format_paise(item.get("unit_price", 0)),
            format_paise(item.get("taxable_value", 0)),
        ]
        if is_inter:
            row.append(f'{format_paise(item.get("igst_amount", 0))} ({item.get("gst_rate", 0)}%)')
        else:
            row.append(f'{format_paise(item.get("cgst_amount", 0))} ({item.get("gst_rate", 0)/2}%)')
            row.append(f'{format_paise(item.get("sgst_amount", 0))} ({item.get("gst_rate", 0)/2}%)')
        row.append(format_paise(item.get("total_amount", 0)))
        table_data.append(row)

    items_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 1), (-1, -1), 8),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.25, colors.lightgrey),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8F8FF")]),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 5*mm))

    # Totals
    totals_data = [
        ["Taxable Value", f"₹{format_paise(invoice.get('total_taxable_value', 0))}"],
    ]
    if is_inter:
        totals_data.append(["IGST", f"₹{format_paise(invoice.get('total_igst', 0))}"])
    else:
        totals_data.append(["CGST", f"₹{format_paise(invoice.get('total_cgst', 0))}"])
        totals_data.append(["SGST", f"₹{format_paise(invoice.get('total_sgst', 0))}"])
    totals_data.append(["Grand Total", f"₹{format_paise(invoice.get('total_amount', 0))}"])

    totals_table = Table(totals_data, colWidths=[12*cm, 6*cm])
    totals_table.setStyle(TableStyle([
        ("ALIGN", (0, 0), (0, -1), "RIGHT"),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, -1), (-1, -1), 11),
        ("TEXTCOLOR", (1, -1), (1, -1), colors.HexColor("#4F46E5")),
        ("LINEABOVE", (0, -1), (-1, -1), 1, colors.HexColor("#4F46E5")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(totals_table)

    # Footer
    elements.append(Spacer(1, 15*mm))
    elements.append(HRFlowable(width="100%", thickness=0.25, color=colors.lightgrey))
    elements.append(Spacer(1, 3*mm))
    elements.append(Paragraph("This is a computer-generated invoice.", label_style))
    elements.append(Paragraph(f"Generated by GST Easy • {business.get('name', '')}", label_style))

    doc.build(elements)
    return buffer.getvalue()


# ─────────────────────────────────────────
# GST Summary Report PDF
# ─────────────────────────────────────────

def generate_summary_pdf(
    business: Dict[str, Any],
    period: str,
    summary: Dict[str, Any],
    sales: List[Dict[str, Any]],
    purchases: List[Dict[str, Any]],
) -> bytes:
    """Generate GST monthly summary report PDF."""
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1.5*cm, bottomMargin=1.5*cm)
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle("Title", parent=styles["Heading1"], fontSize=18,
                                  textColor=colors.HexColor("#4F46E5"))
    section_style = ParagraphStyle("Section", parent=styles["Heading2"], fontSize=13,
                                    spaceBefore=8*mm, spaceAfter=3*mm)
    label_style = ParagraphStyle("Label", parent=styles["Normal"], fontSize=9, textColor=colors.grey)

    elements = []

    elements.append(Paragraph(f"GST Summary — {period}", title_style))
    elements.append(Paragraph(f"{business.get('name', '')} | GSTIN: {business.get('gstin', '')}", label_style))
    elements.append(Spacer(1, 8*mm))

    # Overview table
    overview = [
        ["", "CGST (₹)", "SGST (₹)", "IGST (₹)", "Total (₹)"],
        ["Output GST",
         format_paise(summary.get("output_cgst", 0)),
         format_paise(summary.get("output_sgst", 0)),
         format_paise(summary.get("output_igst", 0)),
         format_paise(summary.get("output_total", 0))],
        ["ITC (Credit)",
         format_paise(summary.get("itc_cgst", 0)),
         format_paise(summary.get("itc_sgst", 0)),
         format_paise(summary.get("itc_igst", 0)),
         format_paise(summary.get("itc_total", 0))],
        ["Net Payable",
         format_paise(summary.get("net_cgst", 0)),
         format_paise(summary.get("net_sgst", 0)),
         format_paise(summary.get("net_igst", 0)),
         format_paise(summary.get("net_total", 0))],
    ]
    ot = Table(overview, colWidths=[3.5*cm, 3.5*cm, 3.5*cm, 3.5*cm, 3.5*cm])
    ot.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.lightgrey),
        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),
        ("BACKGROUND", (0, -1), (-1, -1), colors.HexColor("#EEF2FF")),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(ot)

    # Sales list
    if sales:
        elements.append(Paragraph(f"Sales Invoices ({len(sales)})", section_style))
        s_data = [["#", "Date", "Customer", "Taxable", "GST", "Total"]]
        for i, s in enumerate(sales[:50], 1):
            s_data.append([
                str(i), str(s.get("invoice_date", "")), s.get("party_name", "N/A"),
                format_paise(s.get("total_taxable_value", 0)),
                format_paise(s.get("total_cgst", 0) + s.get("total_sgst", 0) + s.get("total_igst", 0)),
                format_paise(s.get("total_amount", 0)),
            ])
        st = Table(s_data, colWidths=[1*cm, 2.5*cm, 5*cm, 3*cm, 3*cm, 3*cm], repeatRows=1)
        st.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEF2FF")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.2, colors.lightgrey),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(st)

    # Purchases list
    if purchases:
        elements.append(Paragraph(f"Purchase Bills ({len(purchases)})", section_style))
        p_data = [["#", "Date", "Supplier", "Taxable", "GST", "Total"]]
        for i, p in enumerate(purchases[:50], 1):
            p_data.append([
                str(i), str(p.get("invoice_date", "")), p.get("party_name", "N/A"),
                format_paise(p.get("total_taxable_value", 0)),
                format_paise(p.get("total_cgst", 0) + p.get("total_sgst", 0) + p.get("total_igst", 0)),
                format_paise(p.get("total_amount", 0)),
            ])
        pt = Table(p_data, colWidths=[1*cm, 2.5*cm, 5*cm, 3*cm, 3*cm, 3*cm], repeatRows=1)
        pt.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#ECFDF5")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
            ("GRID", (0, 0), (-1, -1), 0.2, colors.lightgrey),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
        ]))
        elements.append(pt)

    # Footer
    elements.append(Spacer(1, 10*mm))
    elements.append(Paragraph("This is a system-generated GST summary for self-assessment only. "
                              "For official filing, consult a qualified CA.", label_style))

    doc.build(elements)
    return buffer.getvalue()
