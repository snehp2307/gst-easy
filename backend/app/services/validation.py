"""
Validation Rules Engine — GSTIN, tax math, place-of-supply, confidence scoring.
"""
import re
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from app.services.gst_engine import GST_RATES
from app.services.indian_states import INDIAN_STATES, STATE_MAP


@dataclass
class ValidationResult:
    rule_id: str
    rule_name: str
    severity: str  # 'critical' | 'warning'
    passed: bool
    message: str
    details: Optional[Dict[str, Any]] = None


# ─────────────────────────────────────────
# GSTIN Validation
# ─────────────────────────────────────────

GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")
GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
GSTIN_CHAR_MAP = {c: i for i, c in enumerate(GSTIN_CHARS)}


def validate_gstin_format(gstin: str) -> ValidationResult:
    """Validate GSTIN 15-character format."""
    if not gstin or gstin.strip() == "":
        return ValidationResult("gstin_format", "GSTIN Format", "warning", True,
                                "GSTIN not provided (B2C transaction)")

    valid = bool(GSTIN_REGEX.match(gstin))
    return ValidationResult(
        "gstin_format", "GSTIN Format", "critical", valid,
        "GSTIN format is valid" if valid else f'Invalid GSTIN format: "{gstin}"'
    )


def validate_gstin_state_code(gstin: str) -> ValidationResult:
    """Validate that GSTIN state code (first 2 digits) is a real Indian state."""
    if not gstin or len(gstin) < 2:
        return ValidationResult("gstin_state", "State Code", "warning", True, "GSTIN not provided")

    state_code = gstin[:2]
    state = STATE_MAP.get(state_code)
    return ValidationResult(
        "gstin_state", "State Code", "critical", state is not None,
        f"State: {state['name']}" if state else f"Invalid state code: {state_code}",
        details={"state_code": state_code, "state_name": state["name"]} if state else None,
    )


def validate_gstin_checksum(gstin: str) -> ValidationResult:
    """Validate GSTIN checksum using Luhn Mod 36 algorithm."""
    if not gstin or len(gstin) != 15:
        return ValidationResult("gstin_checksum", "Checksum", "critical", False,
                                "GSTIN must be 15 characters")

    chars = gstin[:14]
    total = 0
    for i, ch in enumerate(chars):
        char_value = GSTIN_CHAR_MAP.get(ch)
        if char_value is None:
            return ValidationResult("gstin_checksum", "Checksum", "critical", False,
                                    f"Invalid character at position {i + 1}")
        factor = 1 if i % 2 == 0 else 2
        product = char_value * factor
        total += product // 36 + product % 36

    check_digit = (36 - (total % 36)) % 36
    expected = GSTIN_CHARS[check_digit]
    actual = gstin[14]

    return ValidationResult(
        "gstin_checksum", "Checksum", "critical", expected == actual,
        "Checksum valid" if expected == actual else f'Checksum mismatch: expected "{expected}", got "{actual}"'
    )


def validate_gstin(gstin: str) -> List[ValidationResult]:
    """Run all GSTIN validations."""
    if not gstin or gstin.strip() == "":
        return [ValidationResult("gstin_format", "GSTIN Format", "warning", True, "No GSTIN (B2C)")]
    return [
        validate_gstin_format(gstin),
        validate_gstin_state_code(gstin),
        validate_gstin_checksum(gstin),
    ]


def extract_state_from_gstin(gstin: str) -> Optional[Dict[str, str]]:
    """Extract state info from a valid GSTIN."""
    if not gstin or len(gstin) < 2:
        return None
    code = gstin[:2]
    state = STATE_MAP.get(code)
    return {"code": code, "name": state["name"]} if state else None


# ─────────────────────────────────────────
# Tax Math Validation
# ─────────────────────────────────────────

TOLERANCE_PAISE = 100  # ₹1 tolerance for rounding


def validate_gst_rate(rate: float) -> ValidationResult:
    """Check if GST rate is a standard slab."""
    valid = rate in GST_RATES
    return ValidationResult(
        "gst_slab", "GST Slab", "critical", valid,
        f"GST rate {rate}% is valid" if valid else f"GST rate {rate}% is not standard. Valid: {GST_RATES}"
    )


def validate_tax_math(
    taxable_value: int, gst_rate: float, is_inter: bool,
    cgst_amount: int, sgst_amount: int, igst_amount: int,
) -> ValidationResult:
    """Validate line item tax math."""
    if is_inter:
        exp_cgst, exp_sgst = 0, 0
        exp_igst = round(taxable_value * gst_rate / 100)
    else:
        exp_cgst = round(taxable_value * gst_rate / 200)
        exp_sgst = round(taxable_value * gst_rate / 200)
        exp_igst = 0

    ok = (
        abs(cgst_amount - exp_cgst) <= TOLERANCE_PAISE and
        abs(sgst_amount - exp_sgst) <= TOLERANCE_PAISE and
        abs(igst_amount - exp_igst) <= TOLERANCE_PAISE
    )
    return ValidationResult(
        "tax_math", "Tax Calculation", "critical", ok,
        "Tax math correct" if ok else f"Tax mismatch: expected CGST={exp_cgst} SGST={exp_sgst} IGST={exp_igst}",
        details={"expected_cgst": exp_cgst, "expected_sgst": exp_sgst, "expected_igst": exp_igst},
    )


def validate_place_of_supply(
    seller_state: str, buyer_state: str, has_cgst: bool, has_sgst: bool, has_igst: bool,
) -> ValidationResult:
    """Validate GST type matches place of supply."""
    is_inter = seller_state != buyer_state

    if is_inter:
        ok = not has_cgst and not has_sgst and has_igst
        return ValidationResult("pos", "Place of Supply", "critical", ok,
                                f"Inter-state ({seller_state}→{buyer_state}): IGST correct" if ok
                                else "Inter-state must use IGST only")
    else:
        ok = has_cgst and has_sgst and not has_igst
        return ValidationResult("pos", "Place of Supply", "critical", ok,
                                f"Intra-state ({seller_state}): CGST+SGST correct" if ok
                                else "Intra-state must use CGST+SGST")


# ─────────────────────────────────────────
# Confidence Scoring
# ─────────────────────────────────────────

def compute_confidence(results: List[ValidationResult]) -> str:
    """Green / Yellow / Red confidence score."""
    critical_fails = [r for r in results if r.severity == "critical" and not r.passed]
    warnings = [r for r in results if r.severity == "warning" and not r.passed]

    if critical_fails:
        return "red"
    if warnings:
        return "yellow"
    return "green"
