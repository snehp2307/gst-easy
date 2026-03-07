"""
Background task stubs — ready for Redis/Celery in production.
For now, these are simple async functions that can be called inline.
"""
import logging

logger = logging.getLogger("gstflow.tasks")


async def process_document_ocr(document_id: str):
    """Background task: Run OCR on uploaded document and create draft invoice."""
    logger.info("OCR task started for document %s", document_id)
    # In production:
    # 1. Fetch document from S3
    # 2. Run Tesseract/Google Vision OCR
    # 3. Extract invoice fields
    # 4. Validate GSTIN
    # 5. Create draft invoice
    # 6. Update document.ocr_status = 'completed'
    pass


async def generate_report_pdf(business_id: str, period: str, report_type: str):
    """Background task: Generate a PDF report for the given period."""
    logger.info("PDF report task for business %s, period %s", business_id, period)
    pass


async def send_invoice_email(invoice_id: str, recipient_email: str):
    """Background task: Send invoice PDF via email."""
    logger.info("Email task for invoice %s to %s", invoice_id, recipient_email)
    pass
