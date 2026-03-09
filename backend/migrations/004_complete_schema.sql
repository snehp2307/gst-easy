-- ═══════════════════════════════════════════════════════════════
-- GSTFlow — Complete Supabase Migration
-- 20 Tables · Indexes · Foreign Keys · Row-Level Security
-- Run this in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE,
    name            TEXT NOT NULL,
    phone           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT DEFAULT 'admin',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);


-- ─────────────────────────────────────────
-- 2. BUSINESSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS businesses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    gstin           TEXT,
    state_code      TEXT DEFAULT '27',
    state_name      TEXT DEFAULT 'Maharashtra',
    business_type   TEXT DEFAULT 'regular',
    address         TEXT,
    phone           TEXT,
    email           TEXT,
    pan             TEXT,
    financial_year  TEXT DEFAULT '2025-26',
    invoice_prefix  TEXT DEFAULT 'INV',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_businesses_user_id ON businesses (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_businesses_gstin ON businesses (gstin) WHERE gstin IS NOT NULL;


-- ─────────────────────────────────────────
-- 3. USER_BUSINESS_MAP (multi-tenant access)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_business_map (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    role            TEXT DEFAULT 'admin',
    created_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, business_id)
);

CREATE INDEX IF NOT EXISTS ix_ubm_user ON user_business_map (user_id);
CREATE INDEX IF NOT EXISTS ix_ubm_business ON user_business_map (business_id);


-- ─────────────────────────────────────────
-- 4. CUSTOMERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS customers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    gstin           TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    state_code      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_customers_business ON customers (business_id);
CREATE INDEX IF NOT EXISTS ix_customers_gstin ON customers (gstin);


-- ─────────────────────────────────────────
-- 5. VENDORS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    gstin           TEXT,
    phone           TEXT,
    email           TEXT,
    address         TEXT,
    state_code      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_vendors_business ON vendors (business_id);
CREATE INDEX IF NOT EXISTS ix_vendors_gstin ON vendors (gstin);


-- ─────────────────────────────────────────
-- 6. PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name                TEXT NOT NULL,
    description         TEXT,
    hsn_code            VARCHAR(8),
    unit                VARCHAR(20) DEFAULT 'NOS',
    unit_price          BIGINT DEFAULT 0,
    gst_rate            NUMERIC DEFAULT 18.0,
    price               NUMERIC DEFAULT 0,
    stock_quantity      INTEGER DEFAULT 0,
    low_stock_threshold INTEGER DEFAULT 10,
    sku                 VARCHAR(50),
    category            VARCHAR(100),
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_products_business ON products (business_id);
CREATE INDEX IF NOT EXISTS ix_products_hsn ON products (hsn_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_product_sku ON products (business_id, sku) WHERE sku IS NOT NULL;


-- ─────────────────────────────────────────
-- 7. INVENTORY
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inventory (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    stock_quantity  NUMERIC DEFAULT 0,
    unit            TEXT DEFAULT 'NOS',
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_inventory_product ON inventory (product_id);


-- ─────────────────────────────────────────
-- 8. INVOICES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id         UUID REFERENCES customers(id),
    invoice_type        TEXT DEFAULT 'sale',
    invoice_number      TEXT NOT NULL,
    invoice_date        DATE DEFAULT CURRENT_DATE,
    party_name          TEXT,
    party_gstin         TEXT,
    is_inter_state      BOOLEAN DEFAULT false,
    subtotal            NUMERIC DEFAULT 0,
    total_taxable_value BIGINT DEFAULT 0,
    total_cgst          BIGINT DEFAULT 0,
    total_sgst          BIGINT DEFAULT 0,
    total_igst          BIGINT DEFAULT 0,
    cgst                NUMERIC DEFAULT 0,
    sgst                NUMERIC DEFAULT 0,
    igst                NUMERIC DEFAULT 0,
    total_amount        BIGINT DEFAULT 0,
    total               NUMERIC DEFAULT 0,
    payment_status      TEXT DEFAULT 'unpaid',
    status              TEXT DEFAULT 'unpaid',
    filing_period       TEXT,
    confidence_score    TEXT DEFAULT 'high',
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_invoices_business ON invoices (business_id);
CREATE INDEX IF NOT EXISTS ix_invoices_customer ON invoices (customer_id);
CREATE INDEX IF NOT EXISTS ix_invoices_type ON invoices (invoice_type);
CREATE INDEX IF NOT EXISTS ix_invoices_date ON invoices (invoice_date);
CREATE INDEX IF NOT EXISTS ix_invoices_period ON invoices (filing_period);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_number ON invoices (business_id, invoice_number);


-- ─────────────────────────────────────────
-- 9. INVOICE_ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id),
    description     TEXT,
    hsn_code        TEXT,
    quantity        NUMERIC DEFAULT 1,
    unit_price      BIGINT DEFAULT 0,
    price           NUMERIC DEFAULT 0,
    gst_rate        NUMERIC DEFAULT 18.0,
    discount        NUMERIC DEFAULT 0,
    taxable_value   BIGINT DEFAULT 0,
    cgst            BIGINT DEFAULT 0,
    sgst            BIGINT DEFAULT 0,
    igst            BIGINT DEFAULT 0,
    total           NUMERIC DEFAULT 0,
    line_total      BIGINT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_invoice_items_invoice ON invoice_items (invoice_id);


-- ─────────────────────────────────────────
-- 10. BILLS (purchases)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    vendor_id       UUID REFERENCES vendors(id),
    bill_number     TEXT,
    bill_date       DATE DEFAULT CURRENT_DATE,
    supplier_name   TEXT,
    supplier_gstin  TEXT,
    subtotal        NUMERIC DEFAULT 0,
    taxable_value   BIGINT DEFAULT 0,
    cgst_amount     BIGINT DEFAULT 0,
    sgst_amount     BIGINT DEFAULT 0,
    igst_amount     BIGINT DEFAULT 0,
    gst_amount      NUMERIC DEFAULT 0,
    total_amount    BIGINT DEFAULT 0,
    total           NUMERIC DEFAULT 0,
    gst_rate        NUMERIC DEFAULT 18.0,
    itc_eligible    BOOLEAN DEFAULT true,
    itc_status      TEXT DEFAULT 'pending',
    confidence_score TEXT DEFAULT 'medium',
    filing_period   TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_bills_business ON bills (business_id);
CREATE INDEX IF NOT EXISTS ix_bills_vendor ON bills (vendor_id);


-- ─────────────────────────────────────────
-- 11. BILL_ITEMS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bill_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_id         UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
    product_id      UUID REFERENCES products(id),
    description     TEXT,
    quantity        NUMERIC DEFAULT 1,
    price           NUMERIC DEFAULT 0,
    gst_rate        NUMERIC DEFAULT 18.0,
    total           NUMERIC DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_bill_items_bill ON bill_items (bill_id);


-- ─────────────────────────────────────────
-- 12. PAYMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id      UUID REFERENCES invoices(id),
    customer_id     UUID REFERENCES customers(id),
    amount          BIGINT DEFAULT 0,
    payment_method  TEXT DEFAULT 'bank_transfer',
    payment_mode    TEXT DEFAULT 'bank_transfer',
    reference_number TEXT,
    status          TEXT DEFAULT 'completed',
    payment_date    TIMESTAMPTZ DEFAULT now(),
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_payments_business ON payments (business_id);
CREATE INDEX IF NOT EXISTS ix_payments_invoice ON payments (invoice_id);


-- ─────────────────────────────────────────
-- 13. DOCUMENTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    uploaded_by         UUID REFERENCES users(id),
    filename            TEXT NOT NULL,
    file_url            TEXT NOT NULL,
    file_size           INTEGER,
    mime_type           TEXT,
    document_type       TEXT DEFAULT 'invoice',
    file_type           TEXT,
    ocr_status          TEXT DEFAULT 'pending',
    ocr_confidence      FLOAT,
    ocr_raw_text        TEXT,
    ocr_extracted_data  JSONB,
    linked_invoice_id   UUID REFERENCES invoices(id),
    uploaded_at         TIMESTAMPTZ DEFAULT now(),
    created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_documents_business ON documents (business_id);


-- ─────────────────────────────────────────
-- 14. OCR_EXTRACTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ocr_extractions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    vendor_name     TEXT,
    gstin           TEXT,
    amount          NUMERIC,
    extracted_json  JSONB,
    confidence      FLOAT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ocr_document ON ocr_extractions (document_id);


-- ─────────────────────────────────────────
-- 15. GST_RETURNS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gst_returns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    return_type     TEXT NOT NULL,
    period          TEXT NOT NULL,
    gst_payable     NUMERIC DEFAULT 0,
    output_cgst     BIGINT DEFAULT 0,
    output_sgst     BIGINT DEFAULT 0,
    output_igst     BIGINT DEFAULT 0,
    itc_cgst        BIGINT DEFAULT 0,
    itc_sgst        BIGINT DEFAULT 0,
    itc_igst        BIGINT DEFAULT 0,
    net_payable     BIGINT DEFAULT 0,
    status          TEXT DEFAULT 'pending',
    filed_at        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_gst_returns_business ON gst_returns (business_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_gst_return_period ON gst_returns (business_id, return_type, period);


-- ─────────────────────────────────────────
-- 16. AI_INSIGHTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_insights (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    insight_type    TEXT NOT NULL,
    message         TEXT NOT NULL,
    severity        TEXT DEFAULT 'info',
    data            JSONB,
    is_read         BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_insights_business ON ai_insights (business_id);


-- ─────────────────────────────────────────
-- 17. AI_QUERIES (chat history)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_queries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_id     UUID REFERENCES businesses(id),
    question        TEXT NOT NULL,
    response        TEXT,
    response_data   JSONB,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_ai_queries_user ON ai_queries (user_id);


-- ─────────────────────────────────────────
-- 18. SUBSCRIPTIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan            TEXT DEFAULT 'starter',
    status          TEXT DEFAULT 'active',
    billing_cycle   TEXT DEFAULT 'monthly',
    amount          NUMERIC DEFAULT 74900,
    started_at      TIMESTAMPTZ DEFAULT now(),
    expires_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_subscriptions_business ON subscriptions (business_id);


-- ─────────────────────────────────────────
-- 19. NOTIFICATIONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    message         TEXT NOT NULL,
    notification_type TEXT DEFAULT 'info',
    read_status     BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_notifications_business ON notifications (business_id);
CREATE INDEX IF NOT EXISTS ix_notifications_unread ON notifications (business_id, read_status) WHERE read_status = false;


-- ─────────────────────────────────────────
-- 20. BLOG_POSTS (CMS)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blog_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    content         TEXT NOT NULL,
    author          TEXT DEFAULT 'GSTFlow Team',
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_blog_slug ON blog_posts (slug);


-- ─────────────────────────────────────────
-- BONUS: SUPPORT_ARTICLES (Help Center)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS support_articles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    content         TEXT NOT NULL,
    category        TEXT DEFAULT 'General',
    created_at      TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────
-- BONUS: COMPANY_PAGES (CMS)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS company_pages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,
    content         TEXT NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_company_slug ON company_pages (slug);


-- ─────────────────────────────────────────
-- BONUS: GST_MONTHLY_SUMMARIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gst_monthly_summaries (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    period          TEXT NOT NULL,
    output_cgst     BIGINT DEFAULT 0,
    output_sgst     BIGINT DEFAULT 0,
    output_igst     BIGINT DEFAULT 0,
    input_cgst      BIGINT DEFAULT 0,
    input_sgst      BIGINT DEFAULT 0,
    input_igst      BIGINT DEFAULT 0,
    net_cgst        BIGINT DEFAULT 0,
    net_sgst        BIGINT DEFAULT 0,
    net_igst        BIGINT DEFAULT 0,
    itc_carryforward BIGINT DEFAULT 0,
    return_status   TEXT DEFAULT 'pending',
    computed_at     TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gst_summary_period ON gst_monthly_summaries (business_id, period);


-- ─────────────────────────────────────────
-- BONUS: AUDIT_LOGS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    entity_type     VARCHAR(30) NOT NULL,
    entity_id       UUID NOT NULL,
    action          VARCHAR(20) NOT NULL,
    changes         JSONB DEFAULT '{}',
    reason          TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ix_audit_biz_time ON audit_logs (business_id, created_at);


-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════

-- Enable RLS on all business-scoped tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_business_map ENABLE ROW LEVEL SECURITY;

-- Service role bypass (backend uses service key, bypasses RLS)
-- These policies allow the backend service role full access
-- while Supabase anon/user roles get tenant-scoped access

-- Businesses: owner can access
CREATE POLICY "businesses_owner_access" ON businesses
    FOR ALL USING (user_id = auth.uid());

-- User-business map: user can see their own mappings
CREATE POLICY "ubm_user_access" ON user_business_map
    FOR ALL USING (user_id = auth.uid());

-- Business-scoped tables: user must belong to the business
CREATE POLICY "customers_business_access" ON customers
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "vendors_business_access" ON vendors
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "products_business_access" ON products
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "invoices_business_access" ON invoices
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "bills_business_access" ON bills
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "payments_business_access" ON payments
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "documents_business_access" ON documents
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "gst_returns_business_access" ON gst_returns
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "ai_insights_business_access" ON ai_insights
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "subscriptions_business_access" ON subscriptions
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "notifications_business_access" ON notifications
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "gst_summaries_business_access" ON gst_monthly_summaries
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

CREATE POLICY "audit_logs_business_access" ON audit_logs
    FOR ALL USING (business_id IN (
        SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
    ));

-- AI queries: user can see their own
CREATE POLICY "ai_queries_user_access" ON ai_queries
    FOR ALL USING (user_id = auth.uid());

-- Inventory: through product's business
CREATE POLICY "inventory_access" ON inventory
    FOR ALL USING (product_id IN (
        SELECT id FROM products WHERE business_id IN (
            SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
        )
    ));

-- Invoice items: through invoice's business
CREATE POLICY "invoice_items_access" ON invoice_items
    FOR ALL USING (invoice_id IN (
        SELECT id FROM invoices WHERE business_id IN (
            SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
        )
    ));

-- Bill items: through bill's business
CREATE POLICY "bill_items_access" ON bill_items
    FOR ALL USING (bill_id IN (
        SELECT id FROM bills WHERE business_id IN (
            SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
        )
    ));

-- OCR extractions: through document's business
CREATE POLICY "ocr_extractions_access" ON ocr_extractions
    FOR ALL USING (document_id IN (
        SELECT id FROM documents WHERE business_id IN (
            SELECT business_id FROM user_business_map WHERE user_id = auth.uid()
        )
    ));

-- Public CMS tables: no RLS (readable by everyone)
-- blog_posts, support_articles, company_pages stay open


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Blog Posts
-- ═══════════════════════════════════════════════════════════════

INSERT INTO blog_posts (title, slug, content, author) VALUES
(
    'Understanding GSTR-1: A Complete Guide for Indian Businesses',
    'gstr-1-guide',
    'GSTR-1 is a monthly or quarterly return that contains details of outward supplies. Every registered GST dealer needs to file GSTR-1 irrespective of whether there are any business transactions during the return filing period.',
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
    'Input Tax Credit is one of the most critical aspects of GST. Many businesses make errors that lead to rejected ITC claims. Here are the top 5 mistakes and how to avoid them.',
    'Arjun Mehta'
),
(
    'HSN Codes Explained: What Every Business Owner Needs to Know',
    'hsn-codes-guide',
    'The Harmonized System of Nomenclature (HSN) is an internationally standardized system to classify traded products. Understanding HSN codes is crucial for correct GST calculation.',
    'GSTFlow Team'
)
ON CONFLICT (slug) DO NOTHING;


-- ═══════════════════════════════════════════════════════════════
-- SEED DATA — Support Articles
-- ═══════════════════════════════════════════════════════════════

INSERT INTO support_articles (title, content, category) VALUES
('How to create your first invoice', 'Go to Invoices → Create Invoice. Fill in customer details, add line items with HSN codes, and the system will auto-calculate GST.', 'Getting Started'),
('Setting up your business profile', 'Navigate to Settings → Business Profile. Enter your business name, GSTIN, state, PAN, and address.', 'Getting Started'),
('Scanning bills with AI', 'Go to Bills → Upload Bill. Take a clear photo of any purchase bill. Our AI extracts vendor name, amounts, GST details automatically.', 'AI Features'),
('Understanding GST calculations', 'GSTFlow uses state codes to determine CGST+SGST (intra-state) or IGST (inter-state).', 'GST Guide'),
('Exporting reports', 'Go to Reports to download CSV, PDF, or JSON exports of your invoices and GST data.', 'Reports'),
('Managing inventory', 'Add products in the Products page with HSN codes, GST rates, and stock quantities.', 'Inventory'),
('Using the AI Chat', 'Open AI Assistant and type natural language queries like "How much GST do I owe?".', 'AI Features'),
('Recording payments', 'Go to Payments → Record Payment. Select the invoice, enter amount, date, and payment mode.', 'Payments');


-- ═══════════════════════════════════════════════════════════════
-- DONE — All 20+ tables created with RLS & indexes
-- ═══════════════════════════════════════════════════════════════
