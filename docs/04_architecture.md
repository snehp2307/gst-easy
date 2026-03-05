# System Architecture — GST Automation App

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Mobile   │  │ Desktop  │  │ PWA      │                      │
│  │ Browser  │  │ Browser  │  │ (v2)     │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
└───────┼──────────────┼──────────────┼───────────────────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │ HTTPS
┌──────────────────────┼──────────────────────────────────────────┐
│                 FRONTEND (Next.js)                               │
│  ┌───────────────────┴────────────────────┐                     │
│  │  SSR Pages + API Routes (BFF)          │                     │
│  │  • Dashboard         • GST Summary     │                     │
│  │  • Invoice List/Form • Draft Returns   │                     │
│  │  • Bill Upload/Review • Audit Log      │                     │
│  │  • Settings                            │                     │
│  └───────────────────┬────────────────────┘                     │
│  Deployed: Vercel / Cloudflare Pages                            │
└──────────────────────┼──────────────────────────────────────────┘
                       │ REST API (JSON)
┌──────────────────────┼──────────────────────────────────────────┐
│              BACKEND (NestJS / Fastify)                          │
│                      │                                           │
│  ┌───────────┬───────┴──────┬──────────────┬─────────────┐      │
│  │ Auth      │ Invoice      │ Bill         │ GST Engine  │      │
│  │ Module    │ Module       │ Module       │ Module      │      │
│  │           │              │              │             │      │
│  │ • JWT     │ • CRUD       │ • Upload     │ • Tax Calc  │      │
│  │ • RBAC    │ • PDF Gen    │ • OCR Queue  │ • ITC Track │      │
│  │ • OTP     │ • Validation │ • Review     │ • Returns   │      │
│  └───────────┴──────────────┴──────┬───────┴─────────────┘      │
│                                    │                             │
│  ┌─────────────┬───────────────────┼─────────┬──────────────┐   │
│  │ Validation  │ Audit Trail       │ Notif   │ Export       │   │
│  │ Engine      │ Service           │ Service │ Service      │   │
│  │             │                   │         │              │   │
│  │ • GSTIN     │ • Change log      │ • Email │ • PDF Gen    │   │
│  │ • Tax math  │ • Diff tracking   │ • Push  │ • CSV/JSON   │   │
│  │ • Duplicate │ • Immutable log   │ • Cron  │ • GSTR fmt   │   │
│  │ • POS check │                   │         │              │   │
│  └─────────────┴───────────────────┴─────────┴──────────────┘   │
│  Deployed: Railway / Render / AWS ECS                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────┴──────┐ ┌─────┴─────┐ ┌─────┴──────┐
│ PostgreSQL   │ │ Object    │ │ Redis      │
│ (Supabase/   │ │ Storage   │ │ (Optional) │
│  Neon)       │ │ (R2/S3)   │ │            │
│              │ │           │ │ • Sessions │
│ • All data   │ │ • Bill    │ │ • OCR queue│
│ • Audit log  │ │   images  │ │ • Rate     │
│ • ITC track  │ │ • PDFs    │ │   limiting │
│              │ │ • Exports │ │            │
└──────────────┘ └───────────┘ └────────────┘
```

---

## Module Breakdown

### 1. Auth Module
| Responsibility | Implementation |
|----------------|----------------|
| User registration | Phone + OTP (via Twilio/MSG91) |
| Login | JWT access (15 min) + refresh (7 days) |
| Authorization | RBAC: Owner, Accountant, Viewer |
| Session | Stateless JWT, blacklist on logout |

### 2. Invoice Module
| Responsibility | Implementation |
|----------------|----------------|
| Create/edit/delete | REST CRUD with validation |
| Line items | Nested creation, GST auto-calc |
| PDF generation | `@react-pdf/renderer` or `puppeteer` |
| Numbering | Auto-increment with configurable prefix |
| Payment tracking | Status + payment records |

### 3. Bill Module
| Responsibility | Implementation |
|----------------|----------------|
| Image upload | Multipart upload → compress → store in R2/S3 |
| OCR | Tesseract.js (Node) → extract fields |
| Confidence | Score each field 0–100, aggregate to Green/Yellow/Red |
| Review UI | Pre-filled form with edit capability |
| ITC classification | Rule-based: Eligible / Needs Review |

### 4. GST Engine Module
| Responsibility | Implementation |
|----------------|----------------|
| Tax calculation | Pure functions: `calculateGST(taxableValue, rate, placeOfSupply)` |
| ITC aggregation | Monthly rollup by CGST/SGST/IGST |
| ITC cross-utilization | IGST → IGST → CGST → SGST order |
| Net payable | Output GST − Eligible ITC |
| Draft GSTR-1 | Aggregate invoices by B2B/B2CS/HSN |
| Draft GSTR-3B | Fill sections 3.1, 4, 5, 6 from computed data |

### 5. Validation Engine
| Rule | Check |
|------|-------|
| GSTIN format | Regex: `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$` |
| GSTIN state code | First 2 digits match a valid Indian state code |
| GSTIN checksum | Luhn-mod-36 on last character |
| Tax math | Line item: `taxable × rate = tax_amount` (±₹1 tolerance) |
| Invoice totals | Sum of line totals = invoice total (±₹1) |
| Place of supply | Seller state vs buyer state → CGST+SGST or IGST |
| Duplicates | Same supplier GSTIN + invoice number + FY |
| Date range | Invoice date within current/previous FY |

### 6. Audit Trail Service
- Immutable append-only table
- Captures: entity_type, entity_id, action, changed_fields (JSON diff), user_id, timestamp
- No updates/deletes on audit records
- Queryable by entity, user, date range

### 7. Notification Service
- Cron job runs daily at 9 AM IST
- Checks deadlines: GSTR-1 (11th), GSTR-3B (20th)
- Sends reminders at 7, 3, 1 day(s) before
- Channels: In-app banner, email (SendGrid), push (v2)

### 8. Export Service
- PDF: Uses `puppeteer` or `@react-pdf/renderer` for invoices + return summaries
- CSV: Standard comma-separated with headers
- JSON: Structured format matching GSTN offline tool schema

---

## Data Flow Diagrams

### Invoice Creation Flow
```
User fills form → Frontend validates (basic)
    → POST /api/invoices → Backend validates (full)
        → GST Engine calculates tax
        → Validation Engine runs all rules
        → If valid: Save to DB + Create audit log entry
        → If invalid: Return validation errors
    → Response: Invoice with GST breakup + confidence score
    → Frontend shows result
```

### Bill Upload + OCR Flow
```
User captures/uploads image → Frontend compresses to < 200KB
    → POST /api/bills/upload → Backend saves to R2/S3
        → OCR worker extracts text
        → Parser extracts structured fields
        → Confidence scored per field
        → Returns extracted data + confidence
    → User reviews/edits on confirmation screen
    → PUT /api/bills/:id/confirm → Backend validates final data
        → Validation Engine runs
        → ITC classified (Eligible/Review)
        → Save to DB + Audit log
    → Dashboard updates
```

### GST Summary Computation Flow
```
User opens GST Summary → GET /api/gst/summary?month=2025-02
    → Backend queries:
        1. All sales invoices for period → Sum Output GST
        2. All confirmed purchase bills for period → Sum ITC
        3. Apply ITC cross-utilization rules
        4. Compute Net Payable per head (CGST/SGST/IGST)
        5. Check return filing status
    → Returns: { outputGst, itc, netPayable, returnStatus, dueDate }
    → Frontend renders 3 cards
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | Next.js 14 (App Router) | SSR for fast first load, API routes as BFF, code splitting built-in |
| Styling | Tailwind CSS | Utility-first, purged CSS = tiny bundles, fast development |
| Backend framework | NestJS | TypeScript, modular, built-in validation, guards, interceptors |
| ORM | Prisma | Type-safe, auto-generated migrations, great DX |
| Database | PostgreSQL (Neon) | Free tier, serverless, branching for dev/staging |
| Object Storage | Cloudflare R2 | S3-compatible, no egress fees, free tier generous |
| OCR | Tesseract.js | Free, runs on server, good enough for printed text |
| PDF Generation | `@react-pdf/renderer` | React-based templates, server-side rendering |
| Auth | Custom JWT | Simple, stateless, no vendor lock-in |
| Email | SendGrid (free tier) | 100 emails/day free, reliable |
| Deployment | Vercel (FE) + Railway (BE) | Free/cheap tiers, good DX, auto-deploy from Git |

---

## Security Considerations

| Concern | Mitigation |
|---------|------------|
| Data at rest | PostgreSQL built-in encryption, R2 encryption |
| Data in transit | HTTPS everywhere, HSTS |
| Authentication | bcrypt password hashing, JWT with short expiry |
| Authorization | RBAC middleware on every route |
| Input validation | Zod schemas on all API inputs |
| File uploads | Type checking, size limits (5MB), virus scan (v2) |
| Rate limiting | Express rate limiter, 100 req/min per user |
| GSTIN data | Considered PII — encrypted at rest, masked in logs |
| SQL injection | Prisma parameterized queries |
| XSS | Next.js auto-escaping, CSP headers |
| Audit trail | Append-only, no delete API |
