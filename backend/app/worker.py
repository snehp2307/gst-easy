"""
GSTFlow Background Worker — Processes async tasks from Redis queue.

Tasks include:
- OCR processing for uploaded documents
- PDF generation for invoices
- GST summary computation
- Notification dispatching
"""
import asyncio
import json
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [worker] %(message)s")
logger = logging.getLogger("worker")


async def process_ocr_task(data: dict):
    """Process a document through OCR pipeline."""
    logger.info("Processing OCR for document %s", data.get("document_id"))
    # In production, this would:
    # 1. Download the file from S3/storage
    # 2. Run Tesseract OCR
    # 3. Extract structured data using LLM
    # 4. Update the document record in DB
    await asyncio.sleep(2)  # Simulate processing
    logger.info("OCR completed for document %s", data.get("document_id"))


async def process_pdf_task(data: dict):
    """Generate PDF for an invoice."""
    logger.info("Generating PDF for invoice %s", data.get("invoice_id"))
    await asyncio.sleep(1)
    logger.info("PDF generated for invoice %s", data.get("invoice_id"))


async def compute_gst_summary(data: dict):
    """Recompute GST monthly summary for a business."""
    logger.info("Computing GST summary for period %s", data.get("period"))
    await asyncio.sleep(1)
    logger.info("GST summary computed for period %s", data.get("period"))


TASK_HANDLERS = {
    "ocr": process_ocr_task,
    "pdf": process_pdf_task,
    "gst_summary": compute_gst_summary,
}


async def main():
    """Main worker loop — polls Redis for tasks."""
    logger.info("🔧 GSTFlow Worker starting up...")

    try:
        import redis.asyncio as aioredis
        import os
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        redis = aioredis.from_url(redis_url)
        logger.info("✅ Connected to Redis at %s", redis_url)
    except ImportError:
        logger.warning("⚠️ redis package not installed, running in dry-run mode")
        while True:
            await asyncio.sleep(60)
        return

    while True:
        try:
            # Blocking pop from queue
            result = await redis.brpop("gstflow:tasks", timeout=5)
            if result:
                _, raw = result
                task = json.loads(raw)
                task_type = task.get("type")
                handler = TASK_HANDLERS.get(task_type)
                if handler:
                    try:
                        await handler(task.get("data", {}))
                    except Exception as e:
                        logger.error("Task %s failed: %s", task_type, e)
                else:
                    logger.warning("Unknown task type: %s", task_type)
        except Exception as e:
            logger.error("Worker error: %s", e)
            await asyncio.sleep(5)


if __name__ == "__main__":
    asyncio.run(main())
