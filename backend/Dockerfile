# ─────────────────────────────────────────
# GST Easy — FastAPI Backend Dockerfile
# Includes Tesseract OCR for bill scanning
# ─────────────────────────────────────────

FROM python:3.12-slim

# Install Tesseract OCR + system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (cache layer)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy app source
COPY . .

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD python -c "import httpx; r = httpx.get('http://localhost:8000/api/health'); assert r.status_code == 200"

# Start with uvicorn
CMD ["python", "start.py"]
