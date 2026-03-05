"""
GST Calculation Engine — All monetary values in PAISE (integer).

Implements:
- Line item tax calculation (CGST/SGST for intra-state, IGST for inter-state)
- Invoice totals aggregation
- ITC cross-utilization as per CGST Act
- Natural-language explanation generator
- Paise ↔ Rupee conversion utilities
"""
from dataclasses import dataclass, field
from typing import List

GST_RATES = [0, 5, 12, 18, 28]


# ─────────────────────────────────────────
# Data Classes
# ─────────────────────────────────────────

@dataclass
class GstBreakup:
    cgst: int = 0
    sgst: int = 0
    igst: int = 0

    @property
    def total(self) -> int:
        return self.cgst + self.sgst + self.igst


@dataclass
class LineItemResult:
    taxable_value: int = 0
    cgst_rate: float = 0
    sgst_rate: float = 0
    igst_rate: float = 0
    cgst_amount: int = 0
    sgst_amount: int = 0
    igst_amount: int = 0
    total_amount: int = 0


@dataclass
class InvoiceTotals:
    total_taxable_value: int = 0
    total_cgst: int = 0
    total_sgst: int = 0
    total_igst: int = 0
    total_amount: int = 0


@dataclass
class CrossUtilization:
    igst_to_igst: int = 0
    igst_to_cgst: int = 0
    igst_to_sgst: int = 0
    cgst_to_cgst: int = 0
    cgst_to_igst: int = 0
    sgst_to_sgst: int = 0
    sgst_to_igst: int = 0


@dataclass
class NetPayableResult:
    cgst: int = 0
    sgst: int = 0
    igst: int = 0
    total: int = 0
    itc_carryforward: int = 0
    cross_utilization: CrossUtilization = field(default_factory=CrossUtilization)


# ─────────────────────────────────────────
# Core Functions
# ─────────────────────────────────────────

def is_inter_state(seller_state_code: str, buyer_state_code: str) -> bool:
    """Determine if transaction is inter-state."""
    return seller_state_code != buyer_state_code


def calculate_line_item_gst(
    quantity: float,
    unit_price: int,  # paise
    gst_rate: float,
    inter_state: bool,
    discount: int = 0,  # paise
) -> LineItemResult:
    """Calculate GST for a single line item."""
    taxable_value = round(quantity * unit_price) - discount

    if inter_state:
        igst_rate = gst_rate
        igst_amount = round(taxable_value * igst_rate / 100)
        return LineItemResult(
            taxable_value=taxable_value,
            igst_rate=igst_rate,
            igst_amount=igst_amount,
            total_amount=taxable_value + igst_amount,
        )
    else:
        cgst_rate = gst_rate / 2
        sgst_rate = gst_rate / 2
        cgst_amount = round(taxable_value * cgst_rate / 100)
        sgst_amount = round(taxable_value * sgst_rate / 100)
        return LineItemResult(
            taxable_value=taxable_value,
            cgst_rate=cgst_rate,
            sgst_rate=sgst_rate,
            cgst_amount=cgst_amount,
            sgst_amount=sgst_amount,
            total_amount=taxable_value + cgst_amount + sgst_amount,
        )


def calculate_invoice_totals(items: List[LineItemResult]) -> InvoiceTotals:
    """Sum all line items into invoice totals."""
    return InvoiceTotals(
        total_taxable_value=sum(i.taxable_value for i in items),
        total_cgst=sum(i.cgst_amount for i in items),
        total_sgst=sum(i.sgst_amount for i in items),
        total_igst=sum(i.igst_amount for i in items),
        total_amount=sum(i.total_amount for i in items),
    )


def calculate_net_payable(output: GstBreakup, itc: GstBreakup) -> NetPayableResult:
    """
    ITC Cross-Utilization as per CGST Act.

    Order of set-off:
    1. IGST credit → IGST liability
    2. IGST credit → CGST liability
    3. IGST credit → SGST liability
    4. CGST credit → CGST liability
    5. CGST credit → IGST liability
    6. SGST credit → SGST liability
    7. SGST credit → IGST liability

    Note: CGST credit CANNOT offset SGST and vice versa.
    """
    igst_liability = output.igst
    cgst_liability = output.cgst
    sgst_liability = output.sgst

    igst_credit = itc.igst
    cgst_credit = itc.cgst
    sgst_credit = itc.sgst

    # Step 1: IGST credit → IGST liability
    igst_to_igst = min(igst_credit, igst_liability)
    igst_liability -= igst_to_igst
    igst_credit -= igst_to_igst

    # Step 2: IGST credit → CGST liability
    igst_to_cgst = min(igst_credit, cgst_liability)
    cgst_liability -= igst_to_cgst
    igst_credit -= igst_to_cgst

    # Step 3: IGST credit → SGST liability
    igst_to_sgst = min(igst_credit, sgst_liability)
    sgst_liability -= igst_to_sgst
    igst_credit -= igst_to_sgst

    # Step 4: CGST credit → CGST liability
    cgst_to_cgst = min(cgst_credit, cgst_liability)
    cgst_liability -= cgst_to_cgst
    cgst_credit -= cgst_to_cgst

    # Step 5: CGST credit → IGST liability
    cgst_to_igst = min(cgst_credit, igst_liability)
    igst_liability -= cgst_to_igst
    cgst_credit -= cgst_to_igst

    # Step 6: SGST credit → SGST liability
    sgst_to_sgst = min(sgst_credit, sgst_liability)
    sgst_liability -= sgst_to_sgst
    sgst_credit -= sgst_to_sgst

    # Step 7: SGST credit → IGST liability
    sgst_to_igst = min(sgst_credit, igst_liability)
    igst_liability -= sgst_to_igst
    sgst_credit -= sgst_to_igst

    total = cgst_liability + sgst_liability + igst_liability
    itc_carryforward = igst_credit + cgst_credit + sgst_credit

    return NetPayableResult(
        cgst=cgst_liability,
        sgst=sgst_liability,
        igst=igst_liability,
        total=total,
        itc_carryforward=itc_carryforward,
        cross_utilization=CrossUtilization(
            igst_to_igst=igst_to_igst,
            igst_to_cgst=igst_to_cgst,
            igst_to_sgst=igst_to_sgst,
            cgst_to_cgst=cgst_to_cgst,
            cgst_to_igst=cgst_to_igst,
            sgst_to_sgst=sgst_to_sgst,
            sgst_to_igst=sgst_to_igst,
        ),
    )


def generate_explanation(
    output: GstBreakup,
    itc: GstBreakup,
    net: NetPayableResult,
    sales_count: int,
    purchases_count: int,
    eligible_itc: int,
) -> List[str]:
    """Generate natural-language explanation for Net GST Payable."""
    output_total = output.total
    itc_total = itc.total

    lines = [
        f"You collected ₹{format_paise(output_total)} GST from your customers ({sales_count} invoice{'s' if sales_count != 1 else ''}).",
        f"You paid ₹{format_paise(itc_total)} GST on your purchases ({purchases_count} bill{'s' if purchases_count != 1 else ''}). "
        f"₹{format_paise(eligible_itc)} is eligible as credit.",
    ]

    if eligible_itc >= output_total:
        lines.append(f"Your ITC (₹{format_paise(eligible_itc)}) is MORE than your Output GST (₹{format_paise(output_total)}).")
        lines.append("So you owe ₹0 to the government this month.")
        lines.append(f"Remaining ₹{format_paise(net.itc_carryforward)} credit carries to next month.")
    else:
        lines.append(f"Net: ₹{format_paise(output_total)} − ₹{format_paise(eligible_itc)} = ₹{format_paise(output_total - eligible_itc)}.")
        if output.igst > 0 or itc.igst > 0:
            lines.append("IGST credit offsets IGST first, then splits to CGST and SGST.")
        lines.append(f"Final payable: ₹{format_paise(net.total)}.")

    return lines


# ─────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────

def format_paise(paise: int) -> str:
    """Convert paise to formatted rupee string (Indian locale)."""
    rupees = paise / 100
    if paise % 100 == 0:
        # Format with Indian grouping: 1,00,000
        return _indian_format(int(rupees))
    return f"{_indian_format(int(rupees))}.{paise % 100:02d}"


def _indian_format(n: int) -> str:
    """Format integer with Indian comma grouping (12,34,567)."""
    s = str(abs(n))
    if len(s) <= 3:
        return s if n >= 0 else f"-{s}"
    last_three = s[-3:]
    rest = s[:-3]
    result = ""
    for i, ch in enumerate(reversed(rest)):
        if i > 0 and i % 2 == 0:
            result = "," + result
        result = ch + result
    formatted = f"{result},{last_three}"
    return formatted if n >= 0 else f"-{formatted}"


def to_paise(rupees: float) -> int:
    """Convert rupees to paise."""
    return round(rupees * 100)


def to_rupees(paise: int) -> float:
    """Convert paise to rupees."""
    return paise / 100
