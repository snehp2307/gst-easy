# ─────────────────────────────────────────
# GST Easy — FastAPI Backend Dockerfile
# Includes Tesseract OCR for bill scanning and a lightweight base image
# ─────────────────────────────────────────

# Use Python 3.12 on Debian bookworm for stability
FROM python:3.12-slim-bookworm

# Environment settings to keep things clean
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install system dependencies (Tesseract, libraries, curl)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    libgl1 \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Expose port 8000 for FastAPI
EXPOSE 8000

# Health check using curl (simpler than using Python just for health)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# Start the app using start.py
CMD ["python", "start.py"]