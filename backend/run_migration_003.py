"""Direct SQL migration script for Supabase (bypasses Alembic pgbouncer issue)."""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://postgres.rhheiwfgbukrhbcdiqoc:GST_Easy_Password_2024!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

SQLS = [
    # Users columns
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'admin'",
    "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true",

    # Businesses columns
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS phone VARCHAR(15)",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS email VARCHAR(255)",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS pan VARCHAR(10)",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS invoice_prefix VARCHAR(20) DEFAULT 'INV-'",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS next_invoice_no INTEGER DEFAULT 1",
    "ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true",

    # Refresh tokens
    """CREATE TABLE IF NOT EXISTS refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        revoked BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now()
    )""",

    # Customers
    """CREATE TABLE IF NOT EXISTS customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        gstin VARCHAR(15),
        state_code VARCHAR(2),
        state_name VARCHAR(50),
        email VARCHAR(255),
        phone VARCHAR(15),
        address TEXT,
        pincode VARCHAR(6),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    )""",

    # Vendors
    """CREATE TABLE IF NOT EXISTS vendors (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        gstin VARCHAR(15),
        state_code VARCHAR(2),
        state_name VARCHAR(50),
        email VARCHAR(255),
        phone VARCHAR(15),
        address TEXT,
        pincode VARCHAR(6),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
    )""",

    # Documents
    """CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
        uploaded_by UUID NOT NULL REFERENCES users(id),
        filename VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        mime_type VARCHAR(100),
        document_type VARCHAR(20) DEFAULT 'invoice',
        ocr_status VARCHAR(20) DEFAULT 'pending',
        ocr_result JSONB,
        ocr_confidence FLOAT,
        linked_invoice_id UUID REFERENCES invoices(id),
        created_at TIMESTAMPTZ DEFAULT now()
    )""",

    # Invoice columns
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_id UUID",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS vendor_id UUID",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes TEXT",
    "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS terms TEXT",

    # Update alembic version
    "DELETE FROM alembic_version",
    "INSERT INTO alembic_version VALUES ('003')",
]


async def run():
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={"statement_cache_size": 0, "prepared_statement_cache_size": 0},
    )
    async with engine.begin() as conn:
        for sql in SQLS:
            try:
                await conn.execute(text(sql))
                print(f"OK: {sql[:60]}...")
            except Exception as e:
                print(f"SKIP: {sql[:60]}... ({e})")

    await engine.dispose()
    print("\n✅ Migration 003 complete!")


asyncio.run(run())
