"""
OCR pipeline for purchase bill extraction using Tesseract.
"""
import re
from io import BytesIO
from typing import Dict, Any, Tuple

try:
    import pytesseract
    from PIL import Image
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False


# ─────────────────────────────────────────
# OCR Extraction
# ─────────────────────────────────────────

def extract_text_from_image(image_bytes: bytes) -> str:
    """Run Tesseract OCR on image bytes."""
    if not HAS_TESSERACT:
        return ""
    img = Image.open(BytesIO(image_bytes))
    # Convert to grayscale for better OCR accuracy
    img = img.convert("L")
    text = pytesseract.image_to_string(img, lang="eng")
    return text


def extract_bill_fields(text: str) -> Tuple[Dict[str, Any], float]:
    """
    Extract structured fields from OCR text.
    Returns (fields_dict, confidence_0_to_100).
    """
    fields: Dict[str, Any] = {}
    confidence_hits = 0
    total_checks = 7

    # 1. GSTIN — 15-char pattern
    gstin_match = re.search(r"\b(\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d)\b", text.upper())
    if gstin_match:
        fields["supplier_gstin"] = gstin_match.group(1)
        confidence_hits += 1

    # 2. Invoice number — common patterns
    inv_patterns = [
        r"(?:inv(?:oice)?|bill)\s*(?:no|number|#)?[\s.:]*([A-Z0-9/\-]+)",
        r"(?:no|number|#)[\s.:]*([A-Z0-9/\-]{3,})",
    ]
    for pat in inv_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields["invoice_number"] = m.group(1).strip()
            confidence_hits += 1
            break

    # 3. Date — DD/MM/YYYY or DD-MM-YYYY
    date_patterns = [
        r"(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4})",
        r"(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{2,4})",
    ]
    for pat in date_patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            fields["invoice_date"] = m.group(1).strip()
            confidence_hits += 1
            break

    # 4. Amounts — look for rupee values
    amounts = re.findall(r"₹?\s*([\d,]+(?:\.\d{2})?)", text)
    amounts_float = []
    for a in amounts:
        try:
            amounts_float.append(float(a.replace(",", "")))
        except ValueError:
            pass

    if amounts_float:
        # Largest amount is likely the total
        sorted_amounts = sorted(amounts_float, reverse=True)
        fields["total_amount"] = sorted_amounts[0]
        confidence_hits += 1

        # Second largest might be taxable value
        if len(sorted_amounts) > 1:
            fields["taxable_value"] = sorted_amounts[1]
            confidence_hits += 1

    # 5. GST type detection
    if re.search(r"\bIGST\b", text, re.IGNORECASE):
        fields["gst_type"] = "igst"
        igst_match = re.search(r"IGST[\s@]*(\d+(?:\.\d+)?)\s*%?", text, re.IGNORECASE)
        if igst_match:
            fields["igst_rate"] = float(igst_match.group(1))
            confidence_hits += 1
    elif re.search(r"\bCGST\b", text, re.IGNORECASE):
        fields["gst_type"] = "cgst_sgst"
        cgst_match = re.search(r"CGST[\s@]*(\d+(?:\.\d+)?)\s*%?", text, re.IGNORECASE)
        sgst_match = re.search(r"SGST[\s@]*(\d+(?:\.\d+)?)\s*%?", text, re.IGNORECASE)
        if cgst_match:
            fields["cgst_rate"] = float(cgst_match.group(1))
        if sgst_match:
            fields["sgst_rate"] = float(sgst_match.group(1))
        confidence_hits += 1

    # 6. Tax amounts
    for tax_type in ["CGST", "SGST", "IGST"]:
        m = re.search(rf"{tax_type}\s*[:=]?\s*₹?\s*([\d,]+(?:\.\d+)?)", text, re.IGNORECASE)
        if m:
            try:
                fields[f"{tax_type.lower()}_amount"] = float(m.group(1).replace(",", ""))
            except ValueError:
                pass

    # 7. Supplier name (heuristic: first meaningful line)
    lines = [l.strip() for l in text.split("\n") if l.strip() and len(l.strip()) > 3]
    if lines:
        # Skip lines that look like addresses or numbers
        for line in lines[:5]:
            if not re.match(r"^\d", line) and len(line) > 5:
                fields["supplier_name"] = line
                confidence_hits += 1
                break

    confidence = (confidence_hits / total_checks) * 100
    return fields, confidence


def compute_ocr_confidence_score(confidence: float) -> str:
    """Map confidence to green/yellow/red."""
    if confidence >= 70:
        return "green"
    elif confidence >= 40:
        return "yellow"
    return "red"


def compress_image(image_bytes: bytes, max_size: int = 1024, quality: int = 75) -> bytes:
    """Compress image to reduce file size for storage."""
    if not HAS_TESSERACT:
        return image_bytes

    img = Image.open(BytesIO(image_bytes))

    # Resize if too large
    w, h = img.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        new_size = (int(w * ratio), int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)

    # Convert to RGB if needed (for JPEG)
    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output = BytesIO()
    img.save(output, format="JPEG", quality=quality, optimize=True)
    return output.getvalue()


def create_thumbnail(image_bytes: bytes, size: int = 200) -> bytes:
    """Create a small thumbnail for list views."""
    if not HAS_TESSERACT:
        return image_bytes

    img = Image.open(BytesIO(image_bytes))
    img.thumbnail((size, size), Image.LANCZOS)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output = BytesIO()
    img.save(output, format="JPEG", quality=60, optimize=True)
    return output.getvalue()
