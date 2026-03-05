# 60-Day MVP Roadmap — GST Automation App

## Phase Overview

```
Week 1–2:  Foundation (Backend core + DB + Auth)
Week 3–4:  Sales Invoices (Full CRUD + GST calc + PDF)
Week 5–6:  Purchase Bills (Upload + OCR + Review + ITC)
Week 7–8:  GST Summary + Draft Returns + Polish + Launch
```

---

## WEEK 1 (Days 1–7): Project Setup + Database + Auth

### Day 1–2: Project Bootstrap
- [ ] Initialize monorepo structure
- [ ] Set up Next.js frontend with Tailwind CSS
- [ ] Set up NestJS backend with TypeScript
- [ ] Configure ESLint, Prettier, Husky
- [ ] Set up Docker Compose for local dev (Postgres + Redis)
- [ ] Create `docs/` folder with all 10 specification documents

### Day 3–4: Database + ORM
- [ ] Configure Prisma with PostgreSQL
- [ ] Create all migration files (10 tables)
- [ ] Seed Indian states table (38 states/UTs)
- [ ] Write seed script for test data
- [ ] Test migrations locally

### Day 5–7: Authentication
- [ ] User registration with phone + OTP
- [ ] Login with JWT (access + refresh tokens)
- [ ] RBAC middleware (owner/accountant/viewer)
- [ ] Business profile CRUD
- [ ] GSTIN auto-validation on business creation
- [ ] **Unit tests**: Auth flows, JWT, GSTIN validation

**Milestone**: User can register, log in, create a business profile. ✅

---

## WEEK 2 (Days 8–14): Rules Engine + GST Calculation Core

### Day 8–10: Validation Rules Engine
- [ ] Implement `ValidationRule` interface
- [ ] Implement GSTIN format validator (regex + checksum)
- [ ] Implement state code validator
- [ ] Implement GST slab validator
- [ ] Implement tax math validator (line item + total)
- [ ] Implement place-of-supply checker
- [ ] Implement duplicate invoice detector
- [ ] Implement confidence scoring algorithm
- [ ] **Unit tests**: All 15+ GSTIN test cases, all 13 math test cases

### Day 11–12: GST Calculation Functions
- [ ] `calculateLineItemGST()` — pure function
- [ ] `calculateInvoiceTotals()` — aggregation
- [ ] `determineSupplyType()` — intra vs inter state
- [ ] Banker's rounding for paise
- [ ] **Unit tests**: All rate combinations × intra/inter

### Day 13–14: ITC Cross-Utilization Engine
- [ ] Implement cross-utilization algorithm
- [ ] Implement ITC classification logic
- [ ] `calculateNetPayable()` function
- [ ] **Unit tests**: All 4 cross-utilization test cases including edge cases

**Milestone**: All GST math and validation logic is tested and correct. ✅

---

## WEEK 3 (Days 15–21): Sales Invoice Backend + Frontend

### Day 15–17: Invoice API (Backend)
- [ ] POST `/invoices` — create invoice with auto GST calculation
- [ ] GET `/invoices` — list with pagination, filters
- [ ] GET `/invoices/:id` — detail with line items
- [ ] PUT `/invoices/:id` — update with audit trail
- [ ] DELETE `/invoices/:id` — soft delete
- [ ] Invoice number auto-generation
- [ ] Party (customer) auto-create on invoice
- [ ] Validation engine integrated at creation
- [ ] **Integration tests**: Full CRUD suite

### Day 18–19: Invoice Frontend — List View
- [ ] Set up Next.js App Router layout (header, bottom nav, sidebar)
- [ ] Design system: colors, typography (Inter font), spacing tokens
- [ ] Invoice list page with cards
- [ ] Pagination (20 per page)
- [ ] Filter chips: All / Paid / Unpaid / This Month
- [ ] Search by invoice number, buyer name
- [ ] Responsive: cards on mobile, table on desktop

### Day 20–21: Invoice Frontend — Create/Edit Form
- [ ] 3-step wizard: Buyer → Line Items → Review
- [ ] GSTIN input with inline validation
- [ ] Line item form with live GST calculation
- [ ] GST breakup display (CGST/SGST/IGST)
- [ ] Review step with confidence score
- [ ] Validation warnings display
- [ ] Number keypad for mobile inputs

**Milestone**: User can create, view, edit, and delete sales invoices with correct GST. ✅

---

## WEEK 4 (Days 22–28): Invoice Detail + Payment + PDF

### Day 22–23: Invoice Detail View
- [ ] Full invoice display (seller, buyer, line items, totals)
- [ ] GST breakup prominent
- [ ] Confidence score badge (green/yellow/red)
- [ ] Intra/Inter state label
- [ ] Payment status badge

### Day 24–25: Payment Flow
- [ ] POST `/invoices/:id/payments` API
- [ ] "Mark as Paid" modal (date, mode, amount, reference)
- [ ] Partial payment support
- [ ] Payment status auto-update on invoice
- [ ] Audit log entries for payments
- [ ] **Integration tests**: Payment CRUD

### Day 26–28: PDF Generation
- [ ] Invoice PDF template (professional layout)
- [ ] Seller/Buyer details, line items, GST breakup
- [ ] Amount in words
- [ ] Download + share functionality
- [ ] **Test**: Generated PDF matches invoice data

**Milestone**: Complete sales invoice workflow including payments and PDF. ✅

---

## WEEK 5 (Days 29–35): Purchase Bill Upload + OCR

### Day 29–30: Image Upload Infrastructure
- [ ] Configure Cloudflare R2 (or S3) bucket
- [ ] Multipart upload API endpoint
- [ ] Client-side image compression (< 200KB)
- [ ] Thumbnail generation (server-side, Sharp)
- [ ] Upload progress indicator (frontend)
- [ ] File type and size validation

### Day 31–33: OCR Pipeline
- [ ] Set up Tesseract.js on backend
- [ ] OCR text extraction from uploaded images
- [ ] Field parser: extract GSTIN, invoice no, date, amounts
- [ ] Confidence scoring per field
- [ ] Async processing (queue if needed, or sync for MVP volume)
- [ ] Store raw OCR output + structured fields
- [ ] **Test**: Run OCR on 10 sample bills, measure accuracy

### Day 34–35: Bill Review UI
- [ ] OCR confirmation screen (wireframe Screen 5)
- [ ] Thumbnail display (tap to zoom)
- [ ] Each field editable with pencil icon
- [ ] Inline validation check marks / warnings
- [ ] Math cross-check display (taxable × rate = tax)
- [ ] ITC classification dropdown
- [ ] "Confirm & Save" button
- [ ] Auto-create supplier as party

**Milestone**: User can photograph/upload a bill, review OCR extraction, and save. ✅

---

## WEEK 6 (Days 36–42): Purchase Bill List + ITC Tracking

### Day 36–37: Purchase Bill List
- [ ] GET `/invoices?type=purchase` with bill-specific fields
- [ ] Bill list view with thumbnail previews
- [ ] Status indicators: Processing / Review Pending / Confirmed
- [ ] Filter by ITC status (eligible/needs review)
- [ ] Search by supplier, invoice number

### Day 38–39: ITC Tracking Backend
- [ ] Monthly ITC aggregation query
- [ ] ITC by supplier query
- [ ] ITC by bill query
- [ ] ITC classification update API
- [ ] GST monthly summary table population
- [ ] Summary cache invalidation on invoice/bill change

### Day 40–42: ITC Drill-Down UI
- [ ] ITC by supplier view (wireframe Screen 8)
- [ ] ITC by bill view
- [ ] Yellow/Red bill highlighting
- [ ] "Needs Review" quick-action (edit bill)
- [ ] Monthly period selector

**Milestone**: Complete purchase bill workflow with ITC tracking and drill-downs. ✅

---

## WEEK 7 (Days 43–49): GST Summary + Draft Returns

### Day 43–45: GST Summary (THE MOST IMPORTANT SCREEN)
- [ ] GET `/gst/summary` API endpoint
- [ ] Output GST aggregation from sales
- [ ] ITC aggregation from confirmed purchase bills
- [ ] ITC cross-utilization computation
- [ ] Net payable calculation
- [ ] 3-card layout (wireframe Screen 6)
- [ ] "Why this amount?" explainer modal
- [ ] Drill-down: Output GST by invoice, by day
- [ ] Drill-down: ITC by supplier, by bill
- [ ] Month selector
- [ ] **Critical tests**: Verify summary matches sum of all invoices/bills

### Day 46–48: Draft Returns
- [ ] GET `/returns/gstr1` — B2B, B2CS, HSN summary aggregations
- [ ] GET `/returns/gstr3b` — sections 3.1, 4, 6
- [ ] GSTR-1 tab UI with tables
- [ ] GSTR-3B tab UI with summary
- [ ] Validation status display
- [ ] "Lock for Filing" flow (POST `/returns/:period/lock`)
- [ ] Return status tracking (Draft → Ready → Locked)
- [ ] **Test**: Draft return totals match GST summary

### Day 49: Export
- [ ] PDF export for GSTR-1 summary
- [ ] PDF export for GSTR-3B summary
- [ ] CSV export
- [ ] JSON export (GSTN-compatible format)

**Milestone**: User can view GST summary, understand their tax position, and export draft returns. ✅

---

## WEEK 8 (Days 50–60): Dashboard + Audit + Polish + Launch

### Day 50–51: Home Dashboard
- [ ] Dashboard layout (wireframe Screen 1)
- [ ] 4 metric cards: Sales, Purchases, Output GST, ITC
- [ ] Net GST payable card (prominent)
- [ ] Deadline banner (amber/red based on proximity)
- [ ] Return status indicator
- [ ] Quick-action FABs (Create Invoice, Upload Bill)
- [ ] Month selector, default to current month

### Day 52–53: Audit Log + Notifications
- [ ] GET `/audit-log` with filters and pagination
- [ ] Audit log UI (wireframe Screen 10)
- [ ] Filter by entity type, date range
- [ ] Change diff display (old → new)
- [ ] Notification service (cron for deadline reminders)
- [ ] In-app notification bell with badge count
- [ ] Email notifications (SendGrid)

### Day 54–55: Settings + Profile
- [ ] Settings page (wireframe Screen 11)
- [ ] Business profile editing
- [ ] Invoice prefix/numbering configuration
- [ ] Notification preferences
- [ ] Password change
- [ ] "Export All Data" (compliance requirement)

### Day 56–57: Mobile Polish + Performance
- [ ] Mobile responsiveness audit (all screens on 360px)
- [ ] Touch target sizes ≥ 44px
- [ ] Lighthouse audit: fix FCP, LCP, CLS issues
- [ ] Lazy load images, code-split routes
- [ ] Test on slow 3G throttling
- [ ] Fix any visual glitches / overflow issues

### Day 58–59: Testing + Bug Fixes
- [ ] Full E2E test run (Playwright)
- [ ] Run all unit + integration tests
- [ ] Manual testing: complete user journey walkthrough
- [ ] Fix critical bugs from testing
- [ ] Security checklist review

### Day 60: Deploy + Launch
- [ ] Deploy to production (Vercel + Railway + Neon)
- [ ] Run production migrations
- [ ] Smoke test in production
- [ ] Monitor Sentry + UptimeRobot
- [ ] Invite 5–10 beta users
- [ ] Document known limitations for beta

**Milestone**: MVP deployed, beta users onboarded. 🚀

---

## Summary Timeline

```
         Week 1        Week 2        Week 3        Week 4
Day  1──────7    8─────14    15─────21    22─────28
     │ Setup  │  │ Rules  │  │ Invoice│  │ Invoice│
     │ DB     │  │ Engine │  │ Backend│  │ Detail │
     │ Auth   │  │ GST    │  │ Front  │  │ Payment│
     │        │  │ Calc   │  │ end    │  │ PDF    │
     └────────┘  └────────┘  └────────┘  └────────┘
     ✅ Auth      ✅ Engine     ✅ Invoice    ✅ Invoice
       ready       tested      CRUD         complete

         Week 5        Week 6        Week 7        Week 8
Day  29─────35    36─────42    43─────49    50─────60
     │ Bill   │  │ Bill   │  │ GST    │  │ Dash   │
     │ Upload │  │ List   │  │ Summary│  │ Audit  │
     │ OCR    │  │ ITC    │  │ Draft  │  │ Polish │
     │ Review │  │ Track  │  │Returns │  │ Launch │
     └────────┘  └────────┘  └────────┘  └────────┘
     ✅ OCR        ✅ ITC        ✅ Summary   🚀 LAUNCH
       works       tracked      + Returns
```

---

## Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| OCR accuracy too low | Users frustrated | Fallback: manual entry form; upgrade to Google Vision API later |
| Performance on low-end phones | Core users blocked | Performance budget enforced weekly; SSR + code splitting |
| GST calculation edge cases | Trust destroyed | 100% unit test coverage on rules engine; ₹1 tolerance |
| Scope creep (v2 features) | Delay MVP | Strict "v2 tag" on PRD; weekly scope check |
| Database costs scale | Budget exceeded | Neon autoscaling; archive old data to R2 |
| Team velocity | Miss 60-day target | Buffer in Week 8; cut audit log UI if needed (keep backend) |

---

## Definition of Done (per feature)

- [ ] Code is reviewed and merged
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Works on mobile (360px width)
- [ ] Lighthouse score ≥ 90
- [ ] No TypeScript errors
- [ ] Audit trail wired up
- [ ] API documentation updated
