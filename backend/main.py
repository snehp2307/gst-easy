"""
GSTFlow v2.0 — Production-grade GST Automation SaaS Backend.

All endpoints versioned under /api/v1/.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import RequestLoggingMiddleware

# Module routers
from app.modules.auth.router import router as auth_router
from app.modules.business.router import router as business_router
from app.modules.customers.router import router as customers_router
from app.modules.vendors.router import router as vendors_router
from app.modules.invoices.router import router as invoices_router
from app.modules.bills.router import router as bills_router
from app.modules.payments.router import router as payments_router
from app.modules.gst.router import router as gst_router
from app.modules.analytics.router import router as analytics_router
from app.modules.reports.router import router as reports_router
from app.modules.documents.router import router as documents_router
from app.modules.products.router import router as products_router
from app.modules.ai.router import router as ai_router
from app.modules.cms.router import router as cms_router

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("gstflow")


# ─── Lifespan ─────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 GSTFlow v%s starting up...", settings.APP_VERSION)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("✅ Database tables ready")
    yield
    await engine.dispose()
    logger.info("🛑 GSTFlow shut down")


# ─── App ──────────────────────────────────

app = FastAPI(
    title="GSTFlow API",
    description="Production-grade GST Automation SaaS Platform for Indian Businesses",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# ─── Middleware ────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware, max_requests=settings.RATE_LIMIT_PER_MINUTE)
app.add_middleware(RequestLoggingMiddleware)


# ─── API v1 Routes ────────────────────────

API_V1 = "/api/v1"

app.include_router(auth_router, prefix=f"{API_V1}/auth", tags=["Auth"])
app.include_router(business_router, prefix=f"{API_V1}/business", tags=["Business"])
app.include_router(customers_router, prefix=f"{API_V1}/customers", tags=["Customers"])
app.include_router(vendors_router, prefix=f"{API_V1}/vendors", tags=["Vendors"])
app.include_router(invoices_router, prefix=f"{API_V1}/invoices", tags=["Invoices"])
app.include_router(bills_router, prefix=f"{API_V1}/bills", tags=["Bills"])
app.include_router(payments_router, prefix=f"{API_V1}/payments", tags=["Payments"])
app.include_router(gst_router, prefix=f"{API_V1}/gst", tags=["GST Center"])
app.include_router(analytics_router, prefix=f"{API_V1}/analytics", tags=["Analytics & Dashboard"])
app.include_router(reports_router, prefix=f"{API_V1}/reports", tags=["Reports"])
app.include_router(documents_router, prefix=f"{API_V1}/documents", tags=["Documents"])
app.include_router(products_router, prefix=f"{API_V1}/products", tags=["Products"])
app.include_router(ai_router, prefix=f"{API_V1}/ai", tags=["AI Services"])
app.include_router(cms_router, prefix=f"{API_V1}", tags=["CMS"])


# ─── Health Check ─────────────────────────

@app.get("/api/health", tags=["System"])
async def health_check():
    return {"status": "ok", "version": settings.APP_VERSION, "service": "GSTFlow API"}
