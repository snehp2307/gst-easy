"""
GST Easy — FastAPI Application Entry Point
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, invoices, bills, payments, gst, reports

app = FastAPI(
    title="GST Easy API",
    description="Production-grade GST compliance API for Indian small businesses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS — allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(invoices.router, prefix="/api/invoices", tags=["Invoices"])
app.include_router(bills.router, prefix="/api/bills", tags=["Bills"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(gst.router, prefix="/api/gst", tags=["GST"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "version": "1.0.0"}
