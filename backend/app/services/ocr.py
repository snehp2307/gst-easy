"""
Fast OCR pipeline for purchase bill extraction.

Strategy (in order of speed):
1. Google Cloud Vision API — <1s, 1500 free/month
2. Tesseract fallback — if Vision API unavailable
3. Image pre-processing — aggressive resize + threshold before any OCR
"""
import re
import os
import json
import base64
from io import BytesIO
from typing import Dict, Any, Tuple, Optional

try:
    from PIL import Image, ImageFilter, ImageEnhance
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import pytesseract
    HAS_TESSERACT = True
except ImportError:
    HAS_TESSERACT = False

try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    HAS_HTTPX = False


# ─────────────────────────────────────────
# Image Preprocessing (critical for speed)
# ─────────────────────────────────────────

def preprocess_for_ocr(image_bytes: bytes) -> bytes:
    """
    Aggressively pre-process image for fast OCR:
    - Resize to max 1200px (smaller = faster OCR)
    - Convert to grayscale
    - Sharpen + increase contrast
    - Convert to JPEG at 85% quality
    """
    if not HAS_PIL:
        return image_bytes

    img = Image.open(BytesIO(image_bytes))

    # 1. Resize to max 1200px (bills don't need higher res for text)
    w, h = img.size
    max_dim = 1200
    if max(w, h) > max_dim:
        ratio = max_dim / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    # 2. Grayscale
    img = img.convert("L")

    # 3. Sharpen for better text recognition
    img = img.filter(ImageFilter.SHARPEN)

    # 4. Boost contrast
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)

    # 5. Export as optimized JPEG
    output = BytesIO()
    img.save(output, format="JPEG", quality=85, optimize=True)
    return output.getvalue()


# ─────────────────────────────────────────
# Google Cloud Vision API (FAST — <1 second)
# ─────────────────────────────────────────

VISION_API_KEY = os.environ.get("GOOGLE_VISION_API_KEY", "")


async def extract_text_vision_api(image_bytes: bytes) -> Optional[str]:
    """
    Use Google Cloud Vision API for fast OCR.
    Returns extracted text or None if unavailable.

    Free tier: 1,000 units/month for TEXT_DETECTION
    Typical response time: 0.3-0.8 seconds
    """
    if not VISION_API_KEY or not HAS_HTTPX:
        return None

    url = f"https://vision.googleapis.com/v1/images:annotate?key={VISION_API_KEY}"

    # Base64 encode the image
    b64_image = base64.b64encode(image_bytes).decode("utf-8")

    payload = {
        "requests": [{
            "image": {"content": b64_image},
            "features": [{"type": "TEXT_DETECTION", "maxResults": 1}],
        }]
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                return None

            data = response.json()
            annotations = data.get("responses", [{}])[0].get("textAnnotations", [])
            if annotations:
                return annotations[0].get("description", "")
            return ""
    except Exception:
        return None


# ─────────────────────────────────────────
# Tesseract Fallback (slow but free)
# ─────────────────────────────────────────

def extract_text_tesseract(image_bytes: bytes) -> str:
    """Run Tesseract OCR — fallback when Vision API unavailable."""
    if not HAS_TESSERACT or not HAS_PIL:
        return ""
    img = Image.open(BytesIO(image_bytes))
    # Use --psm 6 (assume uniform block of text) for speed
    custom_config = r"--oem 3 --psm 6"
    text = pytesseract.image_to_string(img, lang="eng", config=custom_config)
    return text


# ─────────────────────────────────────────
# Unified OCR Entry Point
# ─────────────────────────────────────────

async def extract_text_from_image(image_bytes: bytes) -> str:
    """
    Extract text from image — tries fast Cloud Vision first,
    falls back to Tesseract if unavailable.
    """
    # Pre-process image (makes both APIs faster)
    processed = preprocess_for_ocr(image_bytes)

    # Try Google Cloud Vision API first (fast)
    text = await extract_text_vision_api(processed)
    if text is not None:
        return text

    # Fallback to Tesseract (slower)
    return extract_text_tesseract(processed)


# ─────────────────────────────────────────
# Field Extraction (unchanged — pure regex, fast)
# ─────────────────────────────────────────

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

    # 2. Invoice number
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

    # 4. Amounts
    amounts = re.findall(r"₹?\s*([\d,]+(?:\.\d{2})?)", text)
    amounts_float = []
    for a in amounts:
        try:
            amounts_float.append(float(a.replace(",", "")))
        except ValueError:
            pass

    if amounts_float:
        sorted_amounts = sorted(amounts_float, reverse=True)
        fields["total_amount"] = sorted_amounts[0]
        confidence_hits += 1
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

    # 7. Supplier name
    lines = [l.strip() for l in text.split("\n") if l.strip() and len(l.strip()) > 3]
    if lines:
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


# ─────────────────────────────────────────
# Image Utilities
# ─────────────────────────────────────────

def compress_image(image_bytes: bytes, max_size: int = 1024, quality: int = 75) -> bytes:
    """Compress image to reduce file size for storage."""
    if not HAS_PIL:
        return image_bytes

    img = Image.open(BytesIO(image_bytes))
    w, h = img.size
    if max(w, h) > max_size:
        ratio = max_size / max(w, h)
        img = img.resize((int(w * ratio), int(h * ratio)), Image.LANCZOS)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output = BytesIO()
    img.save(output, format="JPEG", quality=quality, optimize=True)
    return output.getvalue()


def create_thumbnail(image_bytes: bytes, size: int = 200) -> bytes:
    """Create a small thumbnail for list views."""
    if not HAS_PIL:
        return image_bytes

    img = Image.open(BytesIO(image_bytes))
    img.thumbnail((size, size), Image.LANCZOS)

    if img.mode in ("RGBA", "P"):
        img = img.convert("RGB")

    output = BytesIO()
    img.save(output, format="JPEG", quality=60, optimize=True)
    return output.getvalue()
