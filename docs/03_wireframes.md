# Wireframe Descriptions — GST Automation App

All screens designed mobile-first (360px width). Desktop adapts via responsive grid.

---

## Screen 1: Home Dashboard

```
┌──────────────────────────────────────┐
│  ☰  GST Easy          🔔 2   👤     │  ← Hamburger, notification bell, profile
│──────────────────────────────────────│
│  Welcome, Ravi 👋                    │
│  Ravi Hardware Store                 │
│  GSTIN: 27AABCU9603R1ZP             │
│──────────────────────────────────────│
│  ⚠️ GSTR-1 due in 3 days (11 Mar)   │  ← Deadline banner (amber/red)
│──────────────────────────────────────│
│  February 2025            [▾ Month]  │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ 📤 Sales  │  │ 📥 Purchase│        │
│  │ ₹2,40,000│  │ ₹1,41,600│         │
│  │ 12 inv   │  │ 8 bills  │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  ┌──────────┐  ┌──────────┐         │
│  │ Output   │  │ ITC      │         │
│  │ GST      │  │ (Credit) │         │
│  │ ₹38,400  │  │ ₹21,600  │         │
│  └──────────┘  └──────────┘         │
│                                      │
│  ┌─────────────────────────┐        │
│  │ 💰 Net GST to Pay       │        │
│  │ ₹16,800                 │        │
│  │ Return: Draft ○         │        │
│  │ Due: 20 Mar 2025        │        │
│  └─────────────────────────┘        │
│                                      │
│──────────────────────────────────────│
│  [ + Create Invoice ]  (primary FAB) │
│  [ 📷 Upload Bill ]     (secondary)  │
│──────────────────────────────────────│
│  🏠  📄  📷  📊  ⚙️                  │  ← Bottom nav
│  Home Invoices Bills Summary Settings│
└──────────────────────────────────────┘
```

**Layout notes**:
- 2×2 metric cards at 50% width each
- Net GST card spans full width, visually prominent
- Deadline banner uses conditional color: amber (>3 days), red (≤3 days), green (filed)
- FAB for primary action stays fixed at bottom
- Month selector defaults to current month

---

## Screen 2: Sales Invoice List

```
┌──────────────────────────────────────┐
│  ← Sales Invoices        🔍  ➕      │
│──────────────────────────────────────│
│  [All ▾]  [Paid] [Unpaid] [This Month]│ ← Filter chips
│──────────────────────────────────────│
│  ┌────────────────────────────────┐  │
│  │ INV-001  •  15 Feb 2025       │  │
│  │ Sharma Constructions          │  │
│  │ ₹50,700   CGST+SGST  🟢 Paid │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ INV-002  •  18 Feb 2025       │  │
│  │ Patel Builders                │  │
│  │ ₹1,10,000  IGST     🔴 Unpaid│  │
│  └────────────────────────────────┘  │
│  ... (paginated, 20 per page)        │
│  ┌────────────────────────────────┐  │
│  │  ← Page 1 of 3 →              │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

**Notes**:
- Cards show key info at a glance: number, date, party, amount, tax type, payment status
- Color-coded: Green (paid), Red (unpaid), Yellow (partial)
- Pagination: 20 invoices per page, cursor-based for DB efficiency
- Search by invoice number, buyer name, GSTIN

---

## Screen 3: Sales Invoice Detail

```
┌──────────────────────────────────────┐
│  ← Invoice INV-001   ✏️ Edit  📄 PDF│
│──────────────────────────────────────│
│  Confidence: 🟢 All Valid            │
│──────────────────────────────────────│
│  SELLER                             │
│  Ravi Hardware Store                 │
│  GSTIN: 27AABCU9603R1ZP             │
│  Maharashtra                        │
│──────────────────────────────────────│
│  BUYER                              │
│  Sharma Constructions               │
│  GSTIN: 27AADCS1234F1ZP             │
│  Maharashtra (Same State → CGST+SGST)│
│──────────────────────────────────────│
│  LINE ITEMS                         │
│  ┌──────────────────────────────┐   │
│  │ Cement (50kg) HSN:2523       │   │
│  │ 100 × ₹350 = ₹35,000        │   │
│  │ CGST@14%: ₹4,900            │   │
│  │ SGST@14%: ₹4,900            │   │
│  │ Line Total: ₹44,800         │   │
│  ├──────────────────────────────┤   │
│  │ Paint (1L) HSN:3210          │   │
│  │ 20 × ₹250 = ₹5,000          │   │
│  │ CGST@9%: ₹450               │   │
│  │ SGST@9%: ₹450               │   │
│  │ Line Total: ₹5,900          │   │
│  └──────────────────────────────┘   │
│──────────────────────────────────────│
│  TOTALS                             │
│  Taxable: ₹40,000                   │
│  CGST: ₹5,350                       │
│  SGST: ₹5,350                       │
│  IGST: ₹0                           │
│  ─────────                          │
│  Grand Total: ₹50,700               │
│──────────────────────────────────────│
│  PAYMENT: ✅ Paid on 20-Feb-2025     │
│  Mode: UPI  |  Ref: 1234567890      │
│──────────────────────────────────────│
│  [Mark as Unpaid]  [View Audit Log]  │
└──────────────────────────────────────┘
```

---

## Screen 4: Create/Edit Sales Invoice

```
┌──────────────────────────────────────┐
│  ← New Invoice           Step 1/3    │
│──────────────────────────────────────│
│  BUYER DETAILS                       │
│                                      │
│  GSTIN (optional for B2C):           │
│  ┌────────────────────────────────┐  │
│  │ 27AADCS1234F1ZP               │  │  ← Auto-validates on blur
│  └────────────────────────────────┘  │
│  ✅ Valid GSTIN — Maharashtra        │
│                                      │
│  Buyer Name:                         │
│  ┌────────────────────────────────┐  │
│  │ Sharma Constructions           │  │  ← Auto-fill if GSTIN known
│  └────────────────────────────────┘  │
│                                      │
│  Invoice Date:                       │
│  ┌────────────────────────────────┐  │
│  │ 15-02-2025                    │  │
│  └────────────────────────────────┘  │
│                                      │
│      [Next → Line Items]            │
│──────────────────────────────────────│

--- Step 2: Line Items ---

│  LINE ITEMS                         │
│  ┌────────────────────────────────┐  │
│  │ Description: [Cement 50kg bag ]│  │
│  │ HSN Code:    [2523           ]│  │
│  │ Quantity:    [100            ]│  │
│  │ Unit Price:  [₹350           ]│  │
│  │ GST Rate:    [28% ▾         ]│  │  ← Dropdown: 0/5/12/18/28
│  │ ────────────────────────      │  │
│  │ Taxable:  ₹35,000            │  │  ← Live calculation
│  │ CGST@14%: ₹4,900             │  │
│  │ SGST@14%: ₹4,900             │  │
│  │ Total:    ₹44,800            │  │
│  └────────────────────────────────┘  │
│  [+ Add Another Item]               │
│                                      │
│      [← Back]   [Next → Review]     │

--- Step 3: Review ---

│  REVIEW INVOICE                     │
│  (Read-only summary of all fields)   │
│  Confidence: 🟢 All Valid            │
│                                      │
│  ⚠️ Warnings (if any):              │
│  • Duplicate? Invoice SI/2025/1234   │
│    already exists for this buyer     │
│                                      │
│  [← Back]   [Save Invoice]          │
```

**Notes**:
- 3-step wizard: Buyer → Line Items → Review
- Live GST calculation as user types
- Number keypad auto-opens for numeric fields on mobile
- HSN code lookup (v2: autocomplete from master)

---

## Screen 5: Purchase Bill Upload + OCR Review

```
┌──────────────────────────────────────┐
│  ← Upload Purchase Bill              │
│──────────────────────────────────────│
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │    📷 Take Photo               │  │
│  │         or                     │  │
│  │    📁 Upload File              │  │
│  │    (JPG, PNG, PDF < 5MB)       │  │
│  │                                │  │
│  └────────────────────────────────┘  │
│──────────────────────────────────────│

--- After OCR ---

│  ← Review Extracted Data             │
│──────────────────────────────────────│
│  🖼️ [Thumbnail of uploaded bill]     │  ← Tap to zoom
│  Confidence: 🟡 Needs Review         │
│──────────────────────────────────────│
│  EXTRACTED FIELDS         (tap ✏️)   │
│                                      │
│  Supplier GSTIN:                     │
│  [29AABCS5678G1Z4        ]  ✏️  ✅   │
│  → Karnataka (State 29)             │
│  → Inter-state → IGST               │
│                                      │
│  Supplier Name:                      │
│  [Steel India Traders     ]  ✏️  ✅   │
│                                      │
│  Invoice Number:                     │
│  [SI/2025/1234            ]  ✏️  ✅   │
│                                      │
│  Invoice Date:                       │
│  [15-02-2025              ]  ✏️  ✅   │
│                                      │
│  Taxable Value:                      │
│  [₹1,20,000               ]  ✏️  ⚠️  │
│  ⚠️ OCR confidence: 78%              │
│                                      │
│  IGST @18%:                          │
│  [₹21,600                 ]  ✏️  ✅   │
│  ✅ Math check: 1,20,000 × 18% = 21,600 │
│                                      │
│  Total:                              │
│  [₹1,41,600               ]  ✏️  ✅   │
│  ✅ = Taxable + IGST                 │
│──────────────────────────────────────│
│  ITC Classification:                 │
│  [Eligible ▾]                        │
│  (Eligible / Needs Review / Blocked) │
│──────────────────────────────────────│
│  [Confirm & Save]    [Re-scan]       │
└──────────────────────────────────────┘
```

**Notes**:
- Image shown as compressed thumbnail (tap to zoom loads full image)
- Each field shows OCR confidence inline
- Validation check marks (✅) or warnings (⚠️) next to each field
- Math cross-checks shown inline (taxable × rate = tax amount)
- User must explicitly confirm before saving

---

## Screen 6: GST Summary (MOST IMPORTANT SCREEN)

```
┌──────────────────────────────────────┐
│  ← GST Summary                      │
│──────────────────────────────────────│
│  February 2025            [▾ Month]  │
│──────────────────────────────────────│
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📤 GST COLLECTED (Output GST)  │  │
│  │                                │  │
│  │   CGST      ₹18,200           │  │
│  │   SGST      ₹18,200           │  │
│  │   IGST      ₹2,000            │  │
│  │   ─────────────────            │  │
│  │   Total     ₹38,400           │  │
│  │                                │  │
│  │   From 12 invoices             │  │
│  │   [View by Invoice ▸]         │  │
│  │   [View by Day ▸]             │  │
│  └────────────────────────────────┘  │
│            ➖ minus                   │
│  ┌────────────────────────────────┐  │
│  │ 📥 GST CREDIT (ITC)            │  │
│  │                                │  │
│  │   CGST      ₹5,000            │  │
│  │   SGST      ₹5,000            │  │
│  │   IGST      ₹21,600           │  │
│  │   ─────────────────            │  │
│  │   Total     ₹31,600           │  │
│  │                                │  │
│  │   ✅ Eligible:     ₹28,600     │  │
│  │   ⚠️ Needs Review:  ₹3,000    │  │
│  │                                │  │
│  │   From 8 bills                 │  │
│  │   [View by Supplier ▸]        │  │
│  │   [View by Bill ▸]            │  │
│  └────────────────────────────────┘  │
│            🟰 equals                  │
│  ┌────────────────────────────────┐  │
│  │ 💰 NET GST TO PAY              │  │
│  │                                │  │
│  │   CGST      ₹13,200           │  │
│  │   SGST      ₹13,200           │  │
│  │   IGST      ₹0*               │  │
│  │   ─────────────────            │  │
│  │   Total     ₹6,800†           │  │
│  │                                │  │
│  │   * IGST credit ₹21,600       │  │
│  │     offset against IGST (₹2k) │  │
│  │     → CGST (₹5k) → SGST (₹5k)│  │
│  │     Remaining: ₹9,600 credit  │  │
│  │   † After ITC cross-utilization│  │
│  │                                │  │
│  │   Return: Draft ○              │  │
│  │   Due: 20 Mar 2025             │  │
│  │                                │  │
│  │   [💡 Why this amount?]        │  │ ← Opens explainer
│  │   [🔒 Lock for Filing]         │  │
│  └────────────────────────────────┘  │
│                                      │
│──────────────────────────────────────│
│  [Export PDF]  [Export CSV]  [JSON]   │
└──────────────────────────────────────┘
```

**"Why this amount?" explainer (modal/bottom sheet)**:
```
┌──────────────────────────────────────┐
│  💡 How your GST is calculated       │
│──────────────────────────────────────│
│                                      │
│  1. You collected ₹38,400 GST from   │
│     your customers (12 invoices).    │
│                                      │
│  2. You paid ₹31,600 GST on your    │
│     purchases (8 bills).             │
│     → ₹28,600 is eligible as credit │
│     → ₹3,000 needs your review      │
│                                      │
│  3. Net: ₹38,400 − ₹28,600 =       │
│     ₹9,800 before cross-utilization. │
│                                      │
│  4. IGST credit (₹21,600) is first  │
│     used against IGST liability      │
│     (₹2,000), then splits equally   │
│     to CGST and SGST.               │
│                                      │
│  5. Final payable: ₹6,800.          │
│     Due date: 20 March 2025.        │
│                                      │
│                         [Got it ✓]   │
└──────────────────────────────────────┘
```

---

## Screen 7: Drill-Down — Output GST by Invoice

```
┌──────────────────────────────────────┐
│  ← Output GST — By Invoice          │
│──────────────────────────────────────│
│  February 2025 | Total: ₹38,400     │
│──────────────────────────────────────│
│  Date     | Invoice | CGST  | SGST  | IGST   │
│  ─────────┼─────────┼───────┼───────┼────────│
│  15 Feb   | INV-001 | 5,350 | 5,350 |      0 │
│  18 Feb   | INV-002 |     0 |     0 | 2,000  │
│  20 Feb   | INV-003 | 4,500 | 4,500 |      0 │
│  ...      |         |       |       |        │
│  28 Feb   | INV-012 | 8,350 | 8,350 |      0 │
│──────────────────────────────────────│
│  Totals:           | 18,200|18,200 | 2,000  │
│──────────────────────────────────────│
│  Tap any row to view full invoice    │
└──────────────────────────────────────┘
```

---

## Screen 8: Drill-Down — ITC by Supplier

```
┌──────────────────────────────────────┐
│  ← ITC — By Supplier                │
│──────────────────────────────────────│
│  February 2025 | Total ITC: ₹31,600 │
│──────────────────────────────────────│
│  Supplier            | Bills | ITC     | Status    │
│  ────────────────────┼───────┼─────────┼───────────│
│  Steel India Traders | 1     | ₹21,600 | ✅ Eligible│
│  ABC Electronics     | 3     | ₹4,000  | ✅ Eligible│
│  XYZ Suppliers       | 2     | ₹3,000  | ✅ Eligible│
│  Unknown Vendor      | 2     | ₹3,000  | ⚠️ Review  │
│──────────────────────────────────────│
│  Tap any row to view supplier's bills│
└──────────────────────────────────────┘
```

---

## Screen 9: Draft Returns

```
┌──────────────────────────────────────┐
│  ← Draft Returns                     │
│──────────────────────────────────────│
│  February 2025            [▾ Month]  │
│  Status: 📝 Draft                    │
│──────────────────────────────────────│
│  [GSTR-1]  [GSTR-3B]                │  ← Tab bar
│──────────────────────────────────────│
│  GSTR-1 SUMMARY                     │
│                                      │
│  B2B Invoices (≥ ₹2.5L):            │
│  | GSTIN           | Invoices | Tax  |│
│  |─────────────────|──────────|──────|│
│  | 27AADCS1234F1ZP | 3        | 12k  |│
│  | 29AABCS5678G1Z4 | 1        | 2k   |│
│                                      │
│  B2CS (< ₹2.5L):                    │
│  | State       | Taxable | Tax      |│
│  |─────────────|─────────|──────────|│
│  | Maharashtra | ₹80,000 | ₹14,400  |│
│                                      │
│  HSN Summary:                        │
│  | HSN  | Qty | Taxable | Tax       |│
│  |──────|─────|─────────|───────────|│
│  | 2523 | 200 | ₹70,000 | ₹19,600  |│
│  | 3210 | 50  | ₹12,500 | ₹2,250   |│
│                                      │
│  VALIDATION                         │
│  ✅ All invoices pass validation     │
│  ✅ No mismatches found              │
│──────────────────────────────────────│
│  [🔒 Lock for Filing]               │
│  [Export: PDF | CSV | JSON]          │
└──────────────────────────────────────┘
```

---

## Screen 10: Audit Log

```
┌──────────────────────────────────────┐
│  ← Audit Log              🔍 Filter │
│──────────────────────────────────────│
│  [All] [Invoices] [Bills] [Payments] │
│──────────────────────────────────────│
│  Today, 20 Feb 2025                  │
│  ┌────────────────────────────────┐  │
│  │ 14:30  INV-001 — Payment Added│  │
│  │ By: Ravi                      │  │
│  │ Status: Unpaid → Paid         │  │
│  │ Amount: ₹50,700 via UPI      │  │
│  └────────────────────────────────┘  │
│  ┌────────────────────────────────┐  │
│  │ 11:15  BILL-003 — Field Edit  │  │
│  │ By: Ravi                      │  │
│  │ Taxable Value: ₹1,10,000 →   │  │
│  │                ₹1,20,000      │  │
│  │ Reason: OCR correction        │  │
│  └────────────────────────────────┘  │
│  ... (paginated, 50 per page)        │
└──────────────────────────────────────┘
```

---

## Screen 11: Settings

```
┌──────────────────────────────────────┐
│  ← Settings                         │
│──────────────────────────────────────│
│  BUSINESS PROFILE                    │
│  Business Name:  [Ravi Hardware    ] │
│  GSTIN:          [27AABCU9603R1ZP  ] │
│  State:          [Maharashtra ▾    ] │
│  Business Type:  [Regular ▾        ] │
│  FY:             [2025-26 ▾        ] │
│──────────────────────────────────────│
│  INVOICE SETTINGS                    │
│  Number Prefix:  [INV-             ] │
│  Next Number:    [013              ] │
│──────────────────────────────────────│
│  NOTIFICATIONS                       │
│  Return reminders:    [ON ▸]         │
│  Email notifications: [ON ▸]         │
│──────────────────────────────────────│
│  ACCOUNT                             │
│  [Change Password]                   │
│  [Export All Data]                    │
│  [Log Out]                           │
└──────────────────────────────────────┘
```

---

## Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| < 640px (Mobile) | Single column. Bottom nav. FAB for actions. |
| 640–1024px (Tablet) | 2-column dashboard. Side nav replaces bottom nav. |
| > 1024px (Desktop) | Persistent sidebar. 3-column dashboard. Tables replace cards for lists. |
