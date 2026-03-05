# Product Requirements Document — GST Automation App

## 1. Problem Statement

Indian small businesses (shops, traders, freelancers) spend ₹3,000–₹10,000/month on CAs for routine GST work — filing returns, tracking ITC, checking compliance. Most of this work is rote: calculate tax, match invoices, fill forms. A well-built app can automate 80%+ of this and let the CA focus on advisory, saving the business owner time and money.

## 2. Target Users

| Persona | Description |
|---------|-------------|
| **Ravi (Shop Owner)** | Runs a hardware store. 50–200 invoices/month. Uses a basic Android phone. Needs to know "how much GST do I owe" each month. Currently gives all bills to CA. |
| **Priya (Freelancer)** | Graphic designer. 5–15 invoices/month. Uses laptop. Wants to create professional GST invoices and track ITC from software subscriptions. |
| **Amit (Wholesaler)** | Buys from 30+ suppliers, sells to 100+ retailers. 500+ invoices/month. Needs ITC matching and GSTR-1/3B drafts. Has a bookkeeper. |

## 3. Core Value Proposition

> "Open the app. See exactly how much GST you collected, how much credit you have, and how much you owe the government — in plain Hindi/English. No CA needed for the routine stuff."

---

## 4. MVP Features (v1 — 60 days)

### 4.1 User Actions

| # | Action | Details |
|---|--------|---------|
| 1 | **Create Sales Invoice** | Line items with HSN, qty, rate, GST slab. Auto-calculates CGST/SGST or IGST based on place of supply. Generates PDF. |
| 2 | **Scan/Upload Purchase Bill** | Camera capture or file upload. OCR extracts key fields. User confirms/corrects on a review screen. |
| 3 | **Mark Payment** | Toggle invoice/bill as paid/received. Record payment date, mode, amount. |

### 4.2 System-Computed Features

| Feature | Details |
|---------|---------|
| **GST Calculation** | Dual GST: CGST+SGST (intra-state) or IGST (inter-state). 5 slabs: 0%, 5%, 12%, 18%, 28%. Banker's rounding to 2 decimal places. |
| **ITC Tracking** | Classify each purchase bill's GST into: Eligible, Needs Review, Not Eligible. Aggregate monthly ITC by CGST/SGST/IGST. |
| **GST Summary** | 3-card view: Output GST, ITC, Net Payable. "Why this amount?" explainer. |
| **Draft Returns** | GSTR-1 summary (B2B, B2CS, HSN-wise). GSTR-3B summary. Export as PDF/CSV/JSON. |
| **Deadline Reminders** | Push/email reminders at 7 days, 3 days, 1 day before GSTR-1 (11th) and GSTR-3B (20th) due dates. |
| **Confidence Scoring** | Each invoice/bill scored Green (all valid) / Yellow (needs review) / Red (errors). |
| **Audit Trail** | Every create/edit/delete logged with timestamp, user, old value, new value. |
| **Validation Engine** | GSTIN format check, tax math validation, duplicate detection, place-of-supply check. |

### 4.3 MVP Screens

1. **Home Dashboard**
2. **Sales Invoices** (list + create/edit)
3. **Purchase Bills** (list + scan/upload + review)
4. **GST Summary** (3 cards + drill-down + "Why?" explainer)
5. **Draft Returns** (GSTR-1 + GSTR-3B summaries + export)
6. **Audit Log**
7. **Settings** (business profile, GSTIN, state)

---

## 5. v2 Features (Post-MVP)

| Feature | Priority | Notes |
|---------|----------|-------|
| Credit/Debit Notes | High | Adjustments to invoices |
| Blocked ITC Rules | High | Section 17(5) blocked credits |
| GSTR-2A/2B Reconciliation | High | Match with supplier filings |
| Multi-branch Support | Medium | Multiple GSTINs under one PAN |
| E-invoicing (IRN) | Medium | For turnover > ₹5 Cr |
| E-way Bill | Medium | For goods > ₹50,000 |
| Auto Filing via GSP/ASP | Medium | Official GSTN API integration |
| Refund Tracking | Low | Track refund applications |
| HSN Master Auto-suggest | Low | Search HSN codes while creating line items |
| Multi-user / Roles | Low | Owner, Accountant, Viewer roles |
| Hindi / Regional Language | Low | i18n support |
| Offline Mode (PWA) | Low | Queue invoices when offline |

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Page Load (3G)** | < 3 seconds first contentful paint |
| **JS Bundle** | < 100 KB per page (gzipped) |
| **API Response** | < 200ms p95 for reads, < 500ms for writes |
| **Image Upload** | Compress to < 200 KB before upload |
| **Concurrent Users** | 500 (MVP) |
| **Data Retention** | 8 years (GST audit requirement) |
| **Uptime** | 99.5% |
| **Mobile Support** | Android 8+, iOS 13+, Chrome 80+ |

---

## 7. Out of Scope (Explicitly)

- Auto-filing returns to GSTN portal
- Web scraping of GSTN
- TDS/TCS compliance
- Income Tax / ITR
- Inventory management
- Payroll / HR
- Point-of-sale (POS) hardware integration
