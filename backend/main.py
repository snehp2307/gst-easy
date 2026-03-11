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

# ─── Temp Admin Seed Endpoint (REMOVE LATER) ────────
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import Depends

@app.post("/api/admin/seed", tags=["System"])
async def seed_production_db(db: AsyncSession = Depends(get_db)):
    """Temp endpoint to run database seed on production."""
    from app.models import User, Business, Customer, Vendor, Product, Inventory
    from app.core.security import hash_password
    from sqlalchemy import select
    
    # 1. User
    res = await db.execute(select(User).where(User.email == "demo@gstflow.com"))
    demo_user = res.scalars().first()
    if not demo_user:
        demo_user = User(email="demo@gstflow.com", phone="9999999999", name="Demo User", password_hash=hash_password("password123"), role="admin")
        db.add(demo_user)
        await db.commit()
    
    # 2. Business
    res = await db.execute(select(Business).where(Business.gstin == "24ABCDE1234F1Z5"))
    demo_biz = res.scalars().first()
    if not demo_biz:
        demo_biz = Business(user_id=demo_user.id, name="Demo Traders", gstin="24ABCDE1234F1Z5", state_code="24", state_name="Gujarat", business_type="regular", financial_year="2023-24")
        db.add(demo_biz)
        await db.commit()

    # 3. Customer & Vendor
    res = await db.execute(select(Customer).where(Customer.phone == "8888888881"))
    cust = res.scalars().first()
    if not cust:
        db.add_all([Customer(business_id=demo_biz.id, name="Raj Traders", phone="8888888881", state_code="24"), Customer(business_id=demo_biz.id, name="ABC Enterprises", phone="8888888882", state_code="27")])
        db.add_all([Vendor(business_id=demo_biz.id, name="Patel Suppliers", phone="7777777771", state_code="24"), Vendor(business_id=demo_biz.id, name="Sharma Distributors", phone="7777777772", state_code="07")])
        await db.commit()

    # 4. Products
    res = await db.execute(select(Product).where(Product.name == "Steel Pipe"))
    prod = res.scalars().first()
    if not prod:
        p1 = Product(business_id=demo_biz.id, name="Steel Pipe", unit="KGS", unit_price=150000, gst_rate=18.0)
        p2 = Product(business_id=demo_biz.id, name="Cotton Fabric", unit="MTR", unit_price=20000, gst_rate=5.0)
        p3 = Product(business_id=demo_biz.id, name="Packaging Box", unit="NOS", unit_price=1000, gst_rate=12.0)
        db.add_all([p1, p2, p3])
        await db.commit()
        db.add_all([Inventory(product_id=p1.id, stock_quantity=500.0), Inventory(product_id=p2.id, stock_quantity=1000.0), Inventory(product_id=p3.id, stock_quantity=2000.0)])
        await db.commit()

    return {"message": "Database successfully seeded."}
