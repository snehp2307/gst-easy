# Rules Engine Specification — GST Automation App

## Overview

The validation rules engine runs on every invoice/bill create and update. It produces a **confidence score** (Green/Yellow/Red) and a list of **validation results** for each rule.

Rules are designed as pure functions: `(invoice) → { passed: boolean, message: string }`.

---

## Rule Categories

### Category 1: GSTIN Validation

#### Rule 1.1: GSTIN Format Check
```
Input:  gstin string
Regex:  ^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$
Output: pass/fail

Examples:
  "27AABCU9603R1ZP" → PASS (valid format)
  "27AABCU9603R1Z"  → FAIL (too short, 14 chars)
  "99AABCU9603R1ZP" → FAIL (invalid state code 99)
  "27aabcu9603r1zp" → FAIL (lowercase not allowed)
  ""                → SKIP (B2C, GSTIN optional)
```

#### Rule 1.2: State Code Validation
```
Input:  First 2 digits of GSTIN
Check:  Must exist in indian_states table
Output: pass/fail + resolved state name

Examples:
  "27..." → PASS (Maharashtra)
  "29..." → PASS (Karnataka)
  "00..." → FAIL (no state code 00)
  "99..." → FAIL (no state code 99)
```

#### Rule 1.3: GSTIN Checksum (Luhn Mod 36)
```
Algorithm:
  1. Take first 14 characters of GSTIN
  2. Map each character: 0-9 → 0-9, A-Z → 10-35
  3. For each position i (0-indexed):
     - If i is even: factor = 1
     - If i is odd: factor = 2
     - product = charValue × factor
     - quotient = floor(product / 36)
     - remainder = product % 36
     - sum += quotient + remainder
  4. checkDigit = (36 - (sum % 36)) % 36
  5. Map back to character (0-9, A-Z)
  6. Compare with 15th character

Examples:
  "27AABCU9603R1ZP" → P is correct checksum → PASS
  "27AABCU9603R1ZQ" → Q ≠ P → FAIL
```

### Category 2: Tax Math Validation

#### Rule 2.1: Line Item Tax Calculation
```
For each line item:
  taxableValue = quantity × unitPrice − discount
  
  If intra-state (seller_state == buyer_state):
    expectedCgst = round(taxableValue × gstRate / 200)  // rate/2
    expectedSgst = round(taxableValue × gstRate / 200)
    expectedIgst = 0
  Else (inter-state):
    expectedCgst = 0
    expectedSgst = 0
    expectedIgst = round(taxableValue × gstRate / 100)
  
  Tolerance: ±100 paise (₹1) per line item (for rounding)
  
  Check: |actualCgst - expectedCgst| <= 100
         |actualSgst - expectedSgst| <= 100
         |actualIgst - expectedIgst| <= 100

Examples:
  Item: qty=100, price=35000p, gstRate=28%, intra-state
    taxable = 3,500,000p (₹35,000)
    expectedCgst = round(3500000 × 28/200) = 490,000p (₹4,900) → PASS
    expectedSgst = 490,000p → PASS
    
  Item: qty=1, price=9999p, gstRate=18%, intra-state
    taxable = 9,999p
    expectedCgst = round(9999 × 18/200) = round(899.91) = 900p → PASS if actual is 899 or 900
```

#### Rule 2.2: Invoice Total Validation
```
  sumOfLineTotals = Σ (item.totalAmount for all items)
  expectedTotal = sumOfLineTotals + roundOff
  
  Check: |actualTotal - expectedTotal| <= 100 (₹1 tolerance)
  
  Also check:
    totalCgst = Σ item.cgstAmount
    totalSgst = Σ item.sgstAmount
    totalIgst = Σ item.igstAmount
    totalTaxable = Σ item.taxableValue
```

#### Rule 2.3: GST Slab Validation
```
  Check: gstRate IN (0, 5, 12, 18, 28)
  
  If not: FAIL — "GST rate X% is not a standard slab"
  
  Note: Some items have 0.25% or 3% (gold) — v2 support.
  MVP: Only 0, 5, 12, 18, 28.
```

### Category 3: Place of Supply

#### Rule 3.1: Intra vs Inter State Consistency
```
  sellerState = business.stateCode
  buyerState = extracted from buyer GSTIN (first 2 digits) or manual input
  
  If sellerState == buyerState:
    Must have: CGST > 0 AND SGST > 0 AND IGST == 0
    Flag: "Intra-state transaction — CGST+SGST should be applied"
  Else:
    Must have: CGST == 0 AND SGST == 0 AND IGST > 0
    Flag: "Inter-state transaction — IGST should be applied"
    
  Exception: If buyer has no GSTIN (B2C), use place_of_supply field.

Examples:
  Seller: 27 (MH), Buyer: 27 (MH) → Intra → CGST+SGST ✅
  Seller: 27 (MH), Buyer: 29 (KA) → Inter → IGST ✅
  Seller: 27 (MH), Buyer: 27 (MH) but IGST charged → FAIL ❌
```

### Category 4: Duplicate Detection

#### Rule 4.1: Duplicate Invoice Check
```
  For sales: Check (business_id, invoice_number) uniqueness
  For purchases: Check (business_id, supplier_gstin, invoice_number, financial_year)
  
  If duplicate found:
    FAIL — "Duplicate invoice: matches existing invoice #{existing.invoiceNumber} 
            dated {existing.invoiceDate}"

Examples:
  New: supplier=29AABCS5678G1Z4, inv=SI/2025/1234, FY=2025-26
  Existing: Same supplier, same inv, same FY → FAIL (duplicate)
  Existing: Same supplier, same inv, FY=2024-25 → PASS (different FY)
```

### Category 5: Date Validation

#### Rule 5.1: Invoice Date Range
```
  currentFY = business.financialYear (e.g., "2025-26")
  fyStart = April 1 of first year
  fyEnd = March 31 of second year
  
  Check: fyStart <= invoiceDate <= today + 1 day
  
  If invoiceDate > today: WARNING — "Future-dated invoice"
  If invoiceDate < fyStart: FAIL — "Invoice date before current FY"
```

### Category 6: ITC Classification (Purchase Bills Only)

#### Rule 6.1: Eligible ITC
```
  Conditions for ELIGIBLE:
    AND gstin is present and valid ✅
    AND invoice_number is present ✅
    AND tax_math passes ✅
    AND no duplicate ✅
    AND the bill is confirmed ✅
    
  → itcStatus = "eligible"
```

#### Rule 6.2: Needs Review
```
  Conditions for NEEDS_REVIEW (any one):
    OR gstin is missing/invalid
    OR invoice_number is missing
    OR tax_math fails
    OR OCR confidence < 70%
    OR possible duplicate but not certain
    OR place_of_supply mismatch warning
    
  → itcStatus = "needs_review"
```

#### Rule 6.3: Blocked ITC (v2)
```
  v2 rules (Section 17(5)):
    - Motor vehicles (except specified)
    - Food & beverages
    - Membership of clubs
    - Personal use items
  
  MVP: Not implemented. All non-needs-review items are "eligible".
```

---

## Confidence Scoring Algorithm

```
function computeConfidence(validationResults):
    criticalFails = results.filter(r => r.severity == 'critical' && !r.passed)
    warnings = results.filter(r => r.severity == 'warning' && !r.passed)
    
    if criticalFails.length > 0:
        return 'red'
    elif warnings.length > 0:
        return 'yellow'
    else:
        return 'green'

Rule severity assignment:
    CRITICAL: gstin_format, gstin_checksum, tax_math_line, invoice_total, 
              duplicate_check, gst_slab_valid
    WARNING:  gstin_state_code, place_of_supply, date_range, 
              ocr_confidence_low, missing_optional_fields
```

---

## ITC Cross-Utilization Rules

Per CGST Act and circulars, ITC is utilized in the following order:

```
Step 1: IGST liability
  → First use IGST credit against IGST liability
  → Remaining IGST credit can be used against CGST, then SGST

Step 2: CGST liability
  → Use CGST credit against CGST liability
  → CGST credit CANNOT be used against SGST

Step 3: SGST liability
  → Use SGST credit against SGST liability
  → SGST credit CANNOT be used against CGST

Cross-utilization matrix:
┌────────────┬─────────────────────────────────────┐
│ Credit     │ Can offset liability of:            │
├────────────┼──────┬──────┬──────┬────────────────┤
│            │ IGST │ CGST │ SGST │ Notes          │
├────────────┼──────┼──────┼──────┼────────────────┤
│ IGST credit│  ✅  │  ✅  │  ✅  │ Use in this    │
│            │      │      │      │ order: I→C→S   │
├────────────┼──────┼──────┼──────┼────────────────┤
│ CGST credit│  ✅  │  ✅  │  ❌  │ Cannot use     │
│            │      │      │      │ against SGST   │
├────────────┼──────┼──────┼──────┼────────────────┤
│ SGST credit│  ✅  │  ❌  │  ✅  │ Cannot use     │
│            │      │      │      │ against CGST   │
└────────────┴──────┴──────┴──────┴────────────────┘
```

### Implementation Example

```typescript
function calculateNetPayable(output: GstBreakup, itc: GstBreakup): NetPayable {
  // Start with output GST as liability
  let igstLiability = output.igst;
  let cgstLiability = output.cgst;
  let sgstLiability = output.sgst;
  
  let igstCredit = itc.igst;
  let cgstCredit = itc.cgst;
  let sgstCredit = itc.sgst;
  
  // Step 1: Use IGST credit → IGST liability
  const igstToIgst = Math.min(igstCredit, igstLiability);
  igstLiability -= igstToIgst;
  igstCredit -= igstToIgst;
  
  // Step 2: Remaining IGST credit → CGST liability
  const igstToCgst = Math.min(igstCredit, cgstLiability);
  cgstLiability -= igstToCgst;
  igstCredit -= igstToCgst;
  
  // Step 3: Remaining IGST credit → SGST liability
  const igstToSgst = Math.min(igstCredit, sgstLiability);
  sgstLiability -= igstToSgst;
  igstCredit -= igstToSgst;
  
  // Step 4: Use CGST credit → CGST liability
  const cgstToCgst = Math.min(cgstCredit, cgstLiability);
  cgstLiability -= cgstToCgst;
  cgstCredit -= cgstToCgst;
  
  // Step 5: Remaining CGST credit → IGST liability
  const cgstToIgst = Math.min(cgstCredit, igstLiability);
  igstLiability -= cgstToIgst;
  cgstCredit -= cgstToIgst;
  
  // Step 6: Use SGST credit → SGST liability
  const sgstToSgst = Math.min(sgstCredit, sgstLiability);
  sgstLiability -= sgstToSgst;
  sgstCredit -= sgstToSgst;
  
  // Step 7: Remaining SGST credit → IGST liability
  const sgstToIgst = Math.min(sgstCredit, igstLiability);
  igstLiability -= sgstToIgst;
  sgstCredit -= sgstToIgst;
  
  return {
    cgst: cgstLiability,     // Net CGST payable
    sgst: sgstLiability,     // Net SGST payable
    igst: igstLiability,     // Net IGST payable
    total: cgstLiability + sgstLiability + igstLiability,
    itcCarryforward: igstCredit + cgstCredit + sgstCredit,
    crossUtilization: { igstToIgst, igstToCgst, igstToSgst, cgstToCgst, cgstToIgst, sgstToSgst, sgstToIgst }
  };
}
```

### Worked Example

```
Output GST:  CGST = ₹18,200 | SGST = ₹18,200 | IGST = ₹2,000
ITC:         CGST = ₹5,000  | SGST = ₹5,000  | IGST = ₹21,600

Step 1: IGST credit (₹21,600) → IGST liability (₹2,000)
        Used: ₹2,000. Remaining credit: ₹19,600. IGST liability: ₹0.

Step 2: IGST credit (₹19,600) → CGST liability (₹18,200)
        Used: ₹18,200. Remaining credit: ₹1,400. CGST liability: ₹0.

Step 3: IGST credit (₹1,400) → SGST liability (₹18,200)
        Used: ₹1,400. Remaining credit: ₹0. SGST liability: ₹16,800.

Step 4: CGST credit (₹5,000) → CGST liability (₹0)
        Used: ₹0. Remaining credit: ₹5,000. CGST liability: ₹0.

Step 5: CGST credit (₹5,000) → IGST liability (₹0)
        Used: ₹0. Remaining credit: ₹5,000.

Step 6: SGST credit (₹5,000) → SGST liability (₹16,800)
        Used: ₹5,000. Remaining credit: ₹0. SGST liability: ₹11,800.

Step 7: SGST credit (₹0) → IGST liability (₹0)
        Used: ₹0.

Result:
  Net CGST payable = ₹0
  Net SGST payable = ₹11,800
  Net IGST payable = ₹0
  Total payable = ₹11,800
  ITC carryforward = ₹5,000 (CGST credit unused)
  Cash to pay = ₹11,800 (SGST) via electronic cash ledger
```

---

## Rule Extension Architecture (v2-ready)

```typescript
// Each rule implements this interface
interface ValidationRule {
  id: string;           // e.g., 'gstin_format'
  name: string;         // Human-readable name
  category: string;     // 'gstin', 'tax_math', 'place_of_supply', etc.
  severity: 'critical' | 'warning';
  
  execute(invoice: Invoice, context: BusinessContext): ValidationResult;
}

interface ValidationResult {
  ruleId: string;
  passed: boolean;
  message: string;
  details?: Record<string, any>;
}

// Rules are registered and run via a RulesRunner
class RulesRunner {
  private rules: ValidationRule[] = [];
  
  register(rule: ValidationRule) { this.rules.push(rule); }
  
  run(invoice: Invoice, context: BusinessContext): ValidationReport {
    const results = this.rules.map(r => r.execute(invoice, context));
    return {
      results,
      confidenceScore: this.computeConfidence(results),
      passed: results.every(r => r.severity !== 'critical' || r.passed)
    };
  }
}

// Adding a new rule in v2 is just:
runner.register(new BlockedItcRule());
runner.register(new EInvoiceRequiredRule());
```
