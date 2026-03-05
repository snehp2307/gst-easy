# User Journeys — GST Automation App

All journeys are written from Ravi's perspective (shop owner, basic Android phone, medium-speed internet).

---

## Journey 1: First-Time Setup (5 minutes)

```
Ravi opens app → Sign up with phone number → OTP verification
→ Enter business details:
    - Business name: "Ravi Hardware Store"
    - GSTIN: 27AABCU9603R1ZP
    - State: Maharashtra (auto-detected from GSTIN state code "27")
    - Business type: Regular
    - Financial year: 2025-26
→ Dashboard loads (empty state with guided prompts)
```

**What Ravi sees**: A clean dashboard with 3 big buttons: "Create Invoice", "Upload Bill", "View GST Summary". Empty cards show "No data yet — create your first invoice!"

---

## Journey 2: Create a Sales Invoice (2 minutes)

```
Ravi taps "Create Invoice" on dashboard
→ Invoice form opens:
    Step 1 — Buyer Details:
        - Buyer name: "Sharma Constructions"
        - Buyer GSTIN: 27AADCS1234F1ZP (auto-validates format)
        - State: Maharashtra (auto-filled from GSTIN)
        - System detects: Same state as seller → Intra-state → CGST + SGST

    Step 2 — Line Items:
        - Item: "Cement (50kg bag)", HSN: 2523, Qty: 100, Rate: ₹350
        - GST Slab: 28% (Ravi selects from dropdown: 0/5/12/18/28)
        - System calculates:
            Taxable Value = 100 × 350 = ₹35,000
            CGST @14% = ₹4,900
            SGST @14% = ₹4,900
            Total = ₹44,800
        - Ravi adds another item: "Paint (1L)", HSN: 3210, Qty: 20, Rate: ₹250, GST: 18%
            Taxable = ₹5,000, CGST @9% = ₹450, SGST @9% = ₹450, Total = ₹5,900

    Step 3 — Review:
        - Invoice total: ₹50,700
        - Total CGST: ₹5,350, Total SGST: ₹5,350
        - Confidence: 🟢 Green (all fields valid)
        - Ravi taps "Save & Generate PDF"

→ Invoice saved. PDF generated. Back to invoice list.
→ Dashboard updates: Output GST card shows ₹10,700
```

**Key UX**: Each step fits on one screen. Number keypad opens for amounts. GST breakup is always visible.

---

## Journey 3: Upload a Purchase Bill (3 minutes)

```
Ravi taps "Upload Bill" on dashboard
→ Camera opens (or file picker)
→ Ravi photographs a paper bill from "Steel India Traders"
→ Image auto-compressed to < 200KB, uploaded
→ OCR processes (loading spinner, ~3 seconds)
→ Confirmation screen shows extracted fields:
    ┌─────────────────────────────────────────────┐
    │  Supplier GSTIN: 29AABCS5678G1Z4    ✏️ Edit │
    │  Supplier Name: Steel India Traders  ✏️ Edit │
    │  Invoice No: SI/2025/1234            ✏️ Edit │
    │  Invoice Date: 15-Feb-2025           ✏️ Edit │
    │  Taxable Value: ₹1,20,000            ✏️ Edit │
    │  IGST @18%: ₹21,600                  ✏️ Edit │
    │  Total: ₹1,41,600                    ✏️ Edit │
    │  ───────────────────────────                 │
    │  Confidence: 🟡 Yellow                       │
    │  ⚠️ State code 29 (Karnataka) differs from   │
    │    your state 27 (Maharashtra) → IGST applied │
    │  ✅ GSTIN format valid                        │
    │  ✅ Tax math checks out                       │
    └─────────────────────────────────────────────┘
    [ Confirm & Save ]    [ Edit Fields ]

→ Ravi reviews, taps "Confirm & Save"
→ Bill saved. ITC of ₹21,600 (IGST) added as "Eligible"
→ Dashboard updates: ITC card shows ₹21,600
```

**Key UX**: Every OCR'd field is editable. Confidence color tells Ravi whether he should double-check. Warnings explain WHY something is flagged.

---

## Journey 4: Mark Payment Received (30 seconds)

```
Ravi opens Sales Invoices list
→ Sees invoice #INV-001 to Sharma Constructions — ₹50,700 — "Unpaid"
→ Taps the invoice → Detail view
→ Taps "Mark as Paid"
→ Modal: Payment date (today), Mode (UPI/Cash/Bank), Amount (₹50,700 pre-filled)
→ Ravi confirms
→ Invoice status → "Paid" with green badge
→ Audit log entry created
```

---

## Journey 5: Check GST Summary — "How much do I owe?" (1 minute)

```
Ravi taps "GST Summary" (or it's on the dashboard)
→ Period: February 2025 (dropdown to change month)
→ 3 cards:

    ┌─────────────────────────────────┐
    │  📤 GST Collected (Output GST)   │
    │     CGST: ₹5,350                │
    │     SGST: ₹5,350                │
    │     IGST: ₹0                    │
    │     Total: ₹10,700              │
    │     [View by Invoice ▸]         │
    ├─────────────────────────────────┤
    │  📥 GST Credit (ITC)             │
    │     CGST: ₹0                    │
    │     SGST: ₹0                    │
    │     IGST: ₹21,600               │
    │     ✅ Eligible: ₹21,600        │
    │     ⚠️ Needs Review: ₹0         │
    │     [View by Supplier ▸]        │
    ├─────────────────────────────────┤
    │  💰 Net GST to Pay               │
    │     CGST: ₹0*                   │
    │     SGST: ₹0*                   │
    │     IGST: ₹0                    │
    │     Total: ₹0                   │
    │     🎉 You have ₹10,900 ITC     │
    │        carry-forward (credit)   │
    │     [Why this amount? ▸]        │
    └─────────────────────────────────┘

    * IGST credit of ₹21,600 first offsets IGST (₹0),
      then CGST (₹5,350), then SGST (₹5,350).
      Remaining ₹10,900 carries forward.

→ Ravi taps "Why this amount?"
→ Explainer:
    1. You collected ₹10,700 GST from customers this month.
    2. You paid ₹21,600 GST on your purchases (ITC).
    3. Your ITC (₹21,600) is MORE than your Output GST (₹10,700).
    4. So you owe ₹0 to the government this month.
    5. Remaining ₹10,900 credit carries to next month.

→ Ravi taps "View by Invoice" under Output GST
→ Drill-down list:
    | Date       | Invoice    | Buyer               | CGST    | SGST    | IGST | Total   |
    |------------|------------|----------------------|---------|---------|------|---------|
    | 15-Feb-25  | INV-001    | Sharma Constructions | ₹5,350  | ₹5,350  | ₹0   | ₹10,700 |
```

**Key UX**: The "Why this amount?" button is the most important feature. It turns a confusing tax number into a 5-line explanation anyone can understand.

---

## Journey 6: Review Draft Return (2 minutes)

```
Ravi navigates to "Draft Returns"
→ Selects period: February 2025
→ Two tabs: GSTR-1 | GSTR-3B

GSTR-1 Tab:
    B2B Invoices:
    | Buyer GSTIN          | No. of Invoices | Taxable Value | CGST    | SGST    | IGST |
    |----------------------|-----------------|---------------|---------|---------|------|
    | 27AADCS1234F1ZP      | 1               | ₹40,000       | ₹5,350  | ₹5,350  | ₹0   |

    B2CS (below threshold): None

    HSN Summary:
    | HSN  | Description | Qty | Taxable   | CGST   | SGST   | IGST |
    |------|-------------|-----|-----------|--------|--------|------|
    | 2523 | Cement      | 100 | ₹35,000   | ₹4,900 | ₹4,900 | ₹0   |
    | 3210 | Paint       | 20  | ₹5,000    | ₹450   | ₹450   | ₹0   |

GSTR-3B Tab:
    3.1 Outward Supplies:
        Taxable: ₹40,000 | CGST: ₹5,350 | SGST: ₹5,350 | IGST: ₹0
    4. ITC:
        CGST: ₹0 | SGST: ₹0 | IGST: ₹21,600
    6. Tax Payable:
        CGST: ₹0 | SGST: ₹0 | IGST: ₹0

→ Ravi taps "Export PDF" → PDF downloaded
→ Status shows "Draft — Not Filed"
```

---

## Journey 7: End-of-Month Routine (5 minutes)

```
Day 8 of next month:
→ Ravi gets push notification: "GSTR-1 due in 3 days (11th March). Review your draft."
→ Opens app → Dashboard shows amber banner: "⚠️ GSTR-1 due 11-Mar-2025"
→ Goes to Draft Returns → Reviews GSTR-1
→ Goes to Audit Log → Checks all edits are legitimate
→ Goes back to Draft Returns → Taps "Lock for Filing"
    → System runs final validation
    → All invoices pass → Status changes to "Ready"
→ Ravi exports PDF/JSON → Hands to CA for actual filing on GSTN portal
→ (v2: One-click file via GSP/ASP integration)
```
