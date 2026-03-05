# PostgreSQL Schema — GST Automation App

## ER Diagram (Simplified)

```
┌──────────────┐     ┌──────────────────┐     ┌────────────────┐
│   users      │     │   businesses     │     │   invoices     │
│──────────────│     │──────────────────│     │────────────────│
│ id (PK)      │◄───┤│ id (PK)          │◄───┤│ id (PK)        │
│ email        │     │ user_id (FK)     │     │ business_id(FK)│
│ phone        │     │ name             │     │ type(SALE/PURCH│
│ password_hash│     │ gstin            │     │ invoice_number │
│ role         │     │ state_code       │     │ ... (details)  │
└──────────────┘     │ business_type    │     └───────┬────────┘
                     └──────────────────┘             │
                                                      │ 1:N
                                               ┌──────┴────────┐
                                               │ invoice_items  │
                                               │───────────────│
                                               │ id (PK)       │
                                               │ invoice_id(FK)│
                                               │ hsn_code      │
                                               │ taxable_value │
                                               │ gst_rate      │
                                               │ cgst/sgst/igst│
                                               └───────────────┘
```

---

## Full Schema (Prisma-compatible SQL)

### 1. Users

```sql
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) UNIQUE,
    phone           VARCHAR(15) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'owner'
                    CHECK (role IN ('owner', 'accountant', 'viewer')),
    is_active       BOOLEAN DEFAULT true,
    email_verified  BOOLEAN DEFAULT false,
    phone_verified  BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
```

### 2. Businesses

```sql
CREATE TABLE businesses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    gstin           VARCHAR(15) NOT NULL,
    state_code      VARCHAR(2) NOT NULL,
    state_name      VARCHAR(50) NOT NULL,
    business_type   VARCHAR(20) NOT NULL DEFAULT 'regular'
                    CHECK (business_type IN ('regular', 'composition', 'unregistered')),
    address         TEXT,
    pincode         VARCHAR(6),
    phone           VARCHAR(15),
    email           VARCHAR(255),
    pan             VARCHAR(10),
    financial_year  VARCHAR(7) NOT NULL, -- e.g., '2025-26'
    invoice_prefix  VARCHAR(20) DEFAULT 'INV-',
    next_invoice_no INTEGER DEFAULT 1,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_business_gstin UNIQUE (gstin)
);

CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_gstin ON businesses(gstin);
```

### 3. Parties (Customers / Suppliers)

```sql
CREATE TABLE parties (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    gstin           VARCHAR(15), -- NULL for unregistered
    state_code      VARCHAR(2),
    state_name      VARCHAR(50),
    party_type      VARCHAR(10) NOT NULL CHECK (party_type IN ('customer', 'supplier')),
    address         TEXT,
    phone           VARCHAR(15),
    email           VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parties_business_id ON parties(business_id);
CREATE INDEX idx_parties_gstin ON parties(gstin);
CREATE INDEX idx_parties_type ON parties(business_id, party_type);
```

### 4. Invoices (Sales + Purchases)

```sql
CREATE TABLE invoices (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    party_id            UUID REFERENCES parties(id),

    -- Type and identification
    invoice_type        VARCHAR(10) NOT NULL CHECK (invoice_type IN ('sale', 'purchase')),
    invoice_number      VARCHAR(50) NOT NULL,
    invoice_date        DATE NOT NULL,
    due_date            DATE,

    -- Place of supply
    seller_state_code   VARCHAR(2) NOT NULL,
    buyer_state_code    VARCHAR(2) NOT NULL,
    is_inter_state      BOOLEAN NOT NULL, -- computed: seller_state != buyer_state
    place_of_supply     VARCHAR(2) NOT NULL, -- state code

    -- Amounts (all stored as integers in paise for precision)
    total_taxable_value BIGINT NOT NULL DEFAULT 0, -- in paise
    total_cgst          BIGINT NOT NULL DEFAULT 0,
    total_sgst          BIGINT NOT NULL DEFAULT 0,
    total_igst          BIGINT NOT NULL DEFAULT 0,
    total_cess          BIGINT NOT NULL DEFAULT 0, -- v2
    total_amount        BIGINT NOT NULL DEFAULT 0,
    round_off           BIGINT NOT NULL DEFAULT 0, -- rounding adjustment in paise

    -- For purchase bills
    original_image_url  TEXT,          -- R2/S3 URL
    thumbnail_url       TEXT,          -- compressed thumbnail
    ocr_raw_text        TEXT,          -- raw OCR output
    ocr_confidence      DECIMAL(5,2), -- 0.00 to 100.00

    -- Status and classification
    payment_status      VARCHAR(15) NOT NULL DEFAULT 'unpaid'
                        CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    confidence_score    VARCHAR(10) NOT NULL DEFAULT 'green'
                        CHECK (confidence_score IN ('green', 'yellow', 'red')),
    itc_status          VARCHAR(20) DEFAULT 'eligible'
                        CHECK (itc_status IN ('eligible', 'needs_review', 'blocked', 'not_applicable')),
    is_locked           BOOLEAN DEFAULT false, -- locked for filing
    is_confirmed        BOOLEAN DEFAULT true, -- false until OCR review done
    filing_period       VARCHAR(7), -- e.g., '2025-02' (YYYY-MM)

    -- Metadata
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by          UUID REFERENCES users(id),

    CONSTRAINT uq_invoice_number UNIQUE (business_id, invoice_type, invoice_number, filing_period)
);

-- Core query indexes
CREATE INDEX idx_invoices_business_type ON invoices(business_id, invoice_type);
CREATE INDEX idx_invoices_date ON invoices(business_id, invoice_date);
CREATE INDEX idx_invoices_filing_period ON invoices(business_id, filing_period);
CREATE INDEX idx_invoices_payment_status ON invoices(business_id, payment_status);
CREATE INDEX idx_invoices_party ON invoices(party_id);
CREATE INDEX idx_invoices_confidence ON invoices(business_id, confidence_score);
CREATE INDEX idx_invoices_itc_status ON invoices(business_id, itc_status)
    WHERE invoice_type = 'purchase';

-- Composite index for GST summary queries
CREATE INDEX idx_invoices_gst_summary ON invoices(business_id, invoice_type, filing_period, is_confirmed)
    INCLUDE (total_cgst, total_sgst, total_igst, total_taxable_value);
```

### 5. Invoice Line Items

```sql
CREATE TABLE invoice_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,

    -- Item details
    description     VARCHAR(500) NOT NULL,
    hsn_code        VARCHAR(8), -- HSN/SAC code
    quantity        DECIMAL(12,3) NOT NULL DEFAULT 1,
    unit            VARCHAR(20) DEFAULT 'NOS', -- NOS, KGS, LTR, etc.
    unit_price      BIGINT NOT NULL, -- in paise
    discount        BIGINT NOT NULL DEFAULT 0, -- in paise

    -- Tax
    taxable_value   BIGINT NOT NULL, -- (qty × unit_price) - discount, in paise
    gst_rate        DECIMAL(5,2) NOT NULL, -- 0, 5, 12, 18, 28
    cgst_rate       DECIMAL(5,2) NOT NULL DEFAULT 0,
    sgst_rate       DECIMAL(5,2) NOT NULL DEFAULT 0,
    igst_rate       DECIMAL(5,2) NOT NULL DEFAULT 0,
    cgst_amount     BIGINT NOT NULL DEFAULT 0, -- in paise
    sgst_amount     BIGINT NOT NULL DEFAULT 0,
    igst_amount     BIGINT NOT NULL DEFAULT 0,
    cess_rate       DECIMAL(5,2) DEFAULT 0, -- v2
    cess_amount     BIGINT DEFAULT 0,

    -- Computed
    total_amount    BIGINT NOT NULL, -- taxable + all taxes

    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_hsn ON invoice_items(hsn_code);
```

### 6. Payments

```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    business_id     UUID NOT NULL REFERENCES businesses(id),

    amount          BIGINT NOT NULL, -- in paise
    payment_date    DATE NOT NULL,
    payment_mode    VARCHAR(20) NOT NULL
                    CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'cheque', 'card', 'other')),
    reference_number VARCHAR(100), -- UPI ref, cheque no, etc.
    notes           TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by      UUID REFERENCES users(id)
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_business_date ON payments(business_id, payment_date);
```

### 7. GST Summary Cache

```sql
-- Materialized/cached monthly GST summary for fast reads
CREATE TABLE gst_monthly_summary (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id),
    period          VARCHAR(7) NOT NULL, -- 'YYYY-MM'

    -- Output GST (from sales)
    output_cgst     BIGINT NOT NULL DEFAULT 0,
    output_sgst     BIGINT NOT NULL DEFAULT 0,
    output_igst     BIGINT NOT NULL DEFAULT 0,
    output_total    BIGINT NOT NULL DEFAULT 0,
    sales_count     INTEGER NOT NULL DEFAULT 0,
    total_taxable_sales BIGINT NOT NULL DEFAULT 0,

    -- Input Tax Credit (from purchases)
    itc_cgst        BIGINT NOT NULL DEFAULT 0,
    itc_sgst        BIGINT NOT NULL DEFAULT 0,
    itc_igst        BIGINT NOT NULL DEFAULT 0,
    itc_total       BIGINT NOT NULL DEFAULT 0,
    itc_eligible    BIGINT NOT NULL DEFAULT 0,
    itc_needs_review BIGINT NOT NULL DEFAULT 0,
    itc_blocked     BIGINT NOT NULL DEFAULT 0,
    purchases_count INTEGER NOT NULL DEFAULT 0,
    total_taxable_purchases BIGINT NOT NULL DEFAULT 0,

    -- Net Payable (after ITC cross-utilization)
    net_cgst        BIGINT NOT NULL DEFAULT 0,
    net_sgst        BIGINT NOT NULL DEFAULT 0,
    net_igst        BIGINT NOT NULL DEFAULT 0,
    net_total       BIGINT NOT NULL DEFAULT 0,
    itc_carryforward BIGINT NOT NULL DEFAULT 0, -- excess ITC

    -- Return status
    return_status   VARCHAR(20) NOT NULL DEFAULT 'draft'
                    CHECK (return_status IN ('draft', 'ready', 'locked', 'filed')),
    gstr1_due_date  DATE,
    gstr3b_due_date DATE,
    locked_at       TIMESTAMPTZ,
    locked_by       UUID REFERENCES users(id),

    -- Cache management
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_stale        BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_gst_summary_period UNIQUE (business_id, period)
);

CREATE INDEX idx_gst_summary_business ON gst_monthly_summary(business_id);
CREATE INDEX idx_gst_summary_period ON gst_monthly_summary(business_id, period);
CREATE INDEX idx_gst_summary_status ON gst_monthly_summary(return_status);
```

### 8. Audit Log

```sql
CREATE TABLE audit_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id),
    user_id         UUID NOT NULL REFERENCES users(id),

    -- What changed
    entity_type     VARCHAR(30) NOT NULL, -- 'invoice', 'invoice_item', 'payment', 'business', 'bill'
    entity_id       UUID NOT NULL,
    action          VARCHAR(20) NOT NULL
                    CHECK (action IN ('create', 'update', 'delete', 'confirm', 'lock', 'unlock', 'payment')),

    -- Change details
    changes         JSONB NOT NULL DEFAULT '{}',
    -- Format: { "field_name": { "old": "...", "new": "..." }, ... }

    -- Context
    ip_address      INET,
    user_agent      TEXT,
    reason          TEXT, -- optional reason for change

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- NOTE: No updated_at — audit log is append-only
);

-- Audit log is APPEND-ONLY: remove UPDATE/DELETE permissions
-- REVOKE UPDATE, DELETE ON audit_log FROM app_user;

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_business ON audit_log(business_id, created_at DESC);
CREATE INDEX idx_audit_user ON audit_log(user_id, created_at DESC);
CREATE INDEX idx_audit_date ON audit_log(created_at);
```

### 9. Notifications

```sql
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id),
    user_id         UUID NOT NULL REFERENCES users(id),

    type            VARCHAR(30) NOT NULL, -- 'deadline_reminder', 'validation_alert', 'system'
    title           VARCHAR(255) NOT NULL,
    message         TEXT NOT NULL,
    priority        VARCHAR(10) DEFAULT 'normal'
                    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

    is_read         BOOLEAN DEFAULT false,
    read_at         TIMESTAMPTZ,

    -- Reference to related entity
    ref_type        VARCHAR(30), -- 'gstr1', 'gstr3b', 'invoice', 'bill'
    ref_id          UUID,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notif_user_unread ON notifications(user_id, is_read, created_at DESC)
    WHERE is_read = false;
CREATE INDEX idx_notif_business ON notifications(business_id, created_at DESC);
```

### 10. Refresh Tokens

```sql
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash      VARCHAR(255) NOT NULL UNIQUE,
    device_info     TEXT,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expiry ON refresh_tokens(expires_at)
    WHERE is_revoked = false;
```

---

## Key Design Decisions

### Money in Paise (Integer Storage)
All monetary values stored as `BIGINT` in **paise** (1/100 of rupee).
- **Why**: Avoids floating-point rounding errors
- **Example**: ₹35,000 stored as `3500000` (paise)
- **Display**: Divide by 100 in application layer: `amount / 100`

### Filing Period Format
- Format: `YYYY-MM` (e.g., `2025-02`)
- Used as partition key for all GST queries
- Makes monthly aggregation queries efficient

### Confidence Score
- `green`: All validation rules pass, all fields present
- `yellow`: Minor issues (OCR low confidence, missing optional fields)
- `red`: Critical issues (invalid GSTIN, math mismatch, missing required fields)

### ITC Status (Purchase Invoices Only)
- `eligible`: Valid GSTIN, math correct, no duplicates
- `needs_review`: Missing GSTIN, low OCR confidence, possible duplicate
- `blocked`: Known blocked ITC category (v2)
- `not_applicable`: Not a purchase invoice

### Audit Log Immutability
- No UPDATE or DELETE operations on `audit_log` table
- Application-level enforcement via read-only repository
- Database-level: revoke UPDATE/DELETE permissions

---

## Migration Strategy

```
migrations/
├── 001_create_users.sql
├── 002_create_businesses.sql
├── 003_create_parties.sql
├── 004_create_invoices.sql
├── 005_create_invoice_items.sql
├── 006_create_payments.sql
├── 007_create_gst_monthly_summary.sql
├── 008_create_audit_log.sql
├── 009_create_notifications.sql
├── 010_create_refresh_tokens.sql
├── 011_seed_state_codes.sql
└── 012_seed_hsn_codes.sql   (v2: full HSN master)
```

## State Codes Reference Table

```sql
CREATE TABLE indian_states (
    code    VARCHAR(2) PRIMARY KEY,
    name    VARCHAR(50) NOT NULL,
    ut      BOOLEAN DEFAULT false -- Union Territory flag
);

-- Seed data (first 10 shown)
INSERT INTO indian_states (code, name, ut) VALUES
('01', 'Jammu & Kashmir', true),
('02', 'Himachal Pradesh', false),
('03', 'Punjab', false),
('04', 'Chandigarh', true),
('05', 'Uttarakhand', false),
('06', 'Haryana', false),
('07', 'Delhi', true),
('08', 'Rajasthan', false),
('09', 'Uttar Pradesh', false),
('10', 'Bihar', false),
('11', 'Sikkim', false),
('12', 'Arunachal Pradesh', false),
('13', 'Nagaland', false),
('14', 'Manipur', false),
('15', 'Mizoram', false),
('16', 'Tripura', false),
('17', 'Meghalaya', false),
('18', 'Assam', false),
('19', 'West Bengal', false),
('20', 'Jharkhand', false),
('21', 'Odisha', false),
('22', 'Chhattisgarh', false),
('23', 'Madhya Pradesh', false),
('24', 'Gujarat', false),
('26', 'Dadra & Nagar Haveli and Daman & Diu', true),
('27', 'Maharashtra', false),
('28', 'Andhra Pradesh (old)', false),
('29', 'Karnataka', false),
('30', 'Goa', false),
('31', 'Lakshadweep', true),
('32', 'Kerala', false),
('33', 'Tamil Nadu', false),
('34', 'Puducherry', true),
('35', 'Andaman & Nicobar Islands', true),
('36', 'Telangana', false),
('37', 'Andhra Pradesh', false),
('38', 'Ladakh', true),
('97', 'Other Territory', false);
```
