-- ─────────────────────────────────────────
-- GSTFlow — Supabase Migration: CMS Tables
-- Run in Supabase SQL Editor
-- ─────────────────────────────────────────

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(200) DEFAULT 'GSTFlow Team',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_blog_slug ON blog_posts (slug);

-- Support Articles (Help Center)
CREATE TABLE IF NOT EXISTS support_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Company Pages (About, etc.)
CREATE TABLE IF NOT EXISTS company_pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(300) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_company_slug ON company_pages (slug);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    hsn_code VARCHAR(8),
    unit VARCHAR(20) DEFAULT 'NOS',
    unit_price BIGINT DEFAULT 0,
    gst_rate FLOAT DEFAULT 18.0,
    stock_quantity INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    sku VARCHAR(50),
    category VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_products_business ON products (business_id);
CREATE INDEX IF NOT EXISTS ix_products_hsn ON products (hsn_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sku ON products (business_id, sku);

-- ─────────────────────────────────────────
-- Seed Blog Posts
-- ─────────────────────────────────────────

INSERT INTO blog_posts (title, slug, content, author) VALUES
(
    'Understanding GSTR-1: A Complete Guide for Indian Businesses',
    'gstr-1-guide',
    'GSTR-1 is a monthly or quarterly return that contains details of outward supplies made by a taxpayer. Every registered GST dealer needs to file GSTR-1 irrespective of whether there are any business transactions during the return filing period.',
    'GSTFlow Team'
),
(
    'How AI is Transforming GST Compliance in India',
    'ai-gst-compliance',
    'Artificial Intelligence is revolutionizing how Indian businesses handle their GST obligations. From automated invoice scanning to predictive analytics, AI helps reduce errors by up to 95%.',
    'Priya Sharma'
),
(
    'Input Tax Credit (ITC): Common Mistakes and How to Avoid Them',
    'itc-mistakes',
    'Input Tax Credit is one of the most critical aspects of GST. However, many businesses make errors that lead to rejected ITC claims. Here are the top 5 mistakes.',
    'Arjun Mehta'
),
(
    'HSN Codes Explained: What Every Business Owner Needs to Know',
    'hsn-codes-guide',
    'The Harmonized System of Nomenclature (HSN) is an internationally standardized system of names and numbers to classify traded products. Understanding HSN codes is crucial for correct GST calculation.',
    'GSTFlow Team'
)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────
-- Seed Support Articles
-- ─────────────────────────────────────────

INSERT INTO support_articles (title, content, category) VALUES
('How to create your first invoice', 'Go to Invoices → Create Invoice. Fill in customer details, add line items with HSN codes, and the system will auto-calculate GST.', 'Getting Started'),
('Setting up your business profile', 'Navigate to Settings → Business Profile. Enter your business name, GSTIN, state, PAN, and address.', 'Getting Started'),
('Scanning bills with AI', 'Go to Bills → Upload Bill. Take a clear photo of any purchase bill. Our AI extracts vendor name, amounts, GST details automatically.', 'AI Features'),
('Understanding GST calculations', 'GSTFlow uses state codes to determine CGST+SGST (intra-state) or IGST (inter-state).', 'GST Guide'),
('Exporting reports', 'Go to Reports to download CSV, PDF, or JSON exports of your invoices and GST data.', 'Reports'),
('Managing inventory', 'Add products in the Products page with HSN codes, GST rates, and stock quantities.', 'Inventory'),
('Using the AI Chat', 'Open AI Assistant and type natural language queries like "How much GST do I owe?".', 'AI Features'),
('Recording payments', 'Go to Payments → Record Payment. Select the invoice, enter amount, date, and payment mode.', 'Payments');
