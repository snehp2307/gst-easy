# Testing Plan — GST Automation App

## Testing Strategy

| Layer | Tool | Coverage Target |
|-------|------|-----------------|
| Unit Tests | Jest | Rules engine, GST calculations, GSTIN validation |
| Integration Tests | Supertest + Jest | API endpoints, DB operations |
| E2E Tests | Playwright | Critical user journeys |
| Manual Testing | Checklist | OCR quality, UI/UX, mobile responsiveness |

---

## 1. GST Math Test Cases

### 1.1 Intra-State (CGST + SGST)

| # | Taxable (₹) | Rate | Expected CGST | Expected SGST | Expected IGST | Total |
|---|-------------|------|---------------|---------------|---------------|-------|
| 1 | 35,000 | 28% | 4,900 | 4,900 | 0 | 44,800 |
| 2 | 5,000 | 18% | 450 | 450 | 0 | 5,900 |
| 3 | 10,000 | 12% | 600 | 600 | 0 | 11,200 |
| 4 | 1,00,000 | 5% | 2,500 | 2,500 | 0 | 1,05,000 |
| 5 | 50,000 | 0% | 0 | 0 | 0 | 50,000 |

### 1.2 Inter-State (IGST)

| # | Taxable (₹) | Rate | Expected CGST | Expected SGST | Expected IGST | Total |
|---|-------------|------|---------------|---------------|---------------|-------|
| 6 | 1,20,000 | 18% | 0 | 0 | 21,600 | 1,41,600 |
| 7 | 75,000 | 28% | 0 | 0 | 21,000 | 96,000 |
| 8 | 25,000 | 5% | 0 | 0 | 1,250 | 26,250 |
| 9 | 3,00,000 | 12% | 0 | 0 | 36,000 | 3,36,000 |

### 1.3 Rounding Edge Cases

| # | Taxable (paise) | Rate | Expected Tax (paise) | Notes |
|---|-----------------|------|----------------------|-------|
| 10 | 99,99 (₹99.99) | 18% | CGST: 900, SGST: 900 | round(9999×9/100) = 900 |
| 11 | 1,11 (₹1.11) | 5% | CGST: 3, SGST: 3 | round(111×2.5/100) = 2.775 → 3 |
| 12 | 33,33 (₹33.33) | 12% | CGST: 200, SGST: 200 | round(3333×6/100) = 199.98 → 200 |
| 13 | 1 (₹0.01) | 28% | CGST: 0, SGST: 0 | round(1×14/100) = 0.14 → 0 |

### 1.4 Multi-Item Invoice Totals

```
Test: 3 items, mixed rates, intra-state
  Item 1: ₹35,000 @28% → CGST ₹4,900 + SGST ₹4,900 = ₹44,800
  Item 2: ₹5,000 @18%  → CGST ₹450 + SGST ₹450    = ₹5,900
  Item 3: ₹10,000 @0%  → CGST ₹0 + SGST ₹0         = ₹10,000
  
  Expected totals:
    Taxable: ₹50,000
    CGST: ₹5,350
    SGST: ₹5,350
    IGST: ₹0
    Total: ₹60,700
```

---

## 2. GSTIN Validation Test Cases

### 2.1 Valid GSTINs
```
"27AABCU9603R1ZP" → PASS (Maharashtra, Company)
"29AABCS5678G1Z4" → PASS (Karnataka)
"07AAACR5055K1Z7" → PASS (Delhi)
"33AADCB2230M1ZT" → PASS (Tamil Nadu)
```

### 2.2 Invalid GSTINs
```
"27AABCU9603R1ZQ" → FAIL (checksum mismatch: Q ≠ P)
"99AABCU9603R1ZP" → FAIL (state code 99 does not exist)
"27aabcu9603r1zp" → FAIL (lowercase)
"AABCU9603R1ZP"   → FAIL (missing state code, 13 chars)
"27AABCU9603R1Z"  → FAIL (14 chars, missing check digit)
""                → SKIP (B2C invoice, optional)
"27 AABCU9603R1ZP" → FAIL (contains space)
```

---

## 3. ITC Cross-Utilization Test Cases

### 3.1 Basic Offset
```
Input:
  Output: CGST=10,000 SGST=10,000 IGST=0
  ITC:    CGST=4,000  SGST=4,000  IGST=0

Expected:
  Net:    CGST=6,000  SGST=6,000  IGST=0
  Cash:   ₹12,000
  Carry:  ₹0
```

### 3.2 IGST Credit Cross-Utilization
```
Input:
  Output: CGST=18,200 SGST=18,200 IGST=2,000
  ITC:    CGST=5,000  SGST=5,000  IGST=21,600

Expected:
  IGST→IGST: 2,000 (IGST liability cleared)
  IGST→CGST: 18,200 (CGST liability cleared, actually limited)
  IGST→SGST: ... (remaining credit flows)
  ...
  Net SGST payable: ₹11,800 (see rules engine worked example)
  CGST credit carryforward: ₹5,000
```

### 3.3 Full Credit Offset (No Tax to Pay)
```
Input:
  Output: CGST=5,000  SGST=5,000  IGST=0
  ITC:    CGST=0      SGST=0      IGST=21,600

Expected:
  IGST→IGST: 0
  IGST→CGST: 5,000
  IGST→SGST: 5,000
  Remaining IGST credit: 11,600
  Net payable: ₹0
  Carry forward: ₹11,600
```

### 3.4 Zero Everything
```
Input:
  Output: CGST=0 SGST=0 IGST=0
  ITC:    CGST=0 SGST=0 IGST=0

Expected:
  Net: ₹0, Carry: ₹0
```

---

## 4. Duplicate Detection Test Cases

```
Test 1: Exact duplicate
  Existing: supplier=29AABCS5678G1Z4, inv=SI/2025/1234, period=2025-02
  New:      supplier=29AABCS5678G1Z4, inv=SI/2025/1234, period=2025-02
  → FAIL (duplicate)

Test 2: Same inv, different supplier
  Existing: supplier=29AABCS5678G1Z4, inv=SI/2025/1234
  New:      supplier=27AADCS1234F1ZP, inv=SI/2025/1234
  → PASS (different supplier)

Test 3: Same inv, different FY
  Existing: supplier=29AABCS5678G1Z4, inv=SI/2025/1234, FY=2024-25
  New:      supplier=29AABCS5678G1Z4, inv=SI/2025/1234, FY=2025-26
  → PASS (different FY)
```

---

## 5. Place of Supply Test Cases

```
Test 1: Seller 27 (MH), Buyer GSTIN starts with 27 → Intra → CGST+SGST ✅
Test 2: Seller 27 (MH), Buyer GSTIN starts with 29 → Inter → IGST ✅
Test 3: Seller 27 (MH), Buyer no GSTIN, supply in MH → Intra ✅
Test 4: Seller 27 (MH), Buyer no GSTIN, supply in KA → Inter ✅ (place_of_supply = 29)
Test 5: Intra-state but IGST charged → FAIL validation
Test 6: Inter-state but CGST+SGST charged → FAIL validation
```

---

## 6. API Integration Tests

### Test Suite: Invoice CRUD
```
1. Create invoice → 201, GST calculated correctly
2. Get invoice list → 200, pagination works, filters work
3. Get invoice detail → 200, includes line items
4. Update invoice → 200, audit log created
5. Delete invoice → 200, soft deleted, audit logged
6. Create duplicate → 400, duplicate error
7. Create with invalid GSTIN → 400, validation error
8. Create without auth → 401
9. Access other business's invoice → 403
10. Lock invoice → 200, status=locked, cannot edit after
```

### Test Suite: Bill Upload + OCR
```
1. Upload valid image → 202, OCR started
2. Get OCR result → 200, extracted fields present
3. Confirm bill → 200, ITC recorded
4. Upload oversized file → 400, file too large
5. Upload invalid format → 400, unsupported format
```

### Test Suite: GST Summary
```
1. Empty month → 200, all zeros
2. Month with only sales → 200, output GST correct, ITC=0
3. Month with sales + purchases → 200, cross-utilization correct
4. Drill-down by invoice → matches summary total
5. Drill-down by supplier → matches ITC total
```

---

## 7. E2E Test Scenarios (Playwright)

```
Scenario 1: Full invoice creation flow
  1. Login → Dashboard
  2. Click "Create Invoice"
  3. Enter buyer GSTIN → auto-validates
  4. Add 2 line items
  5. Verify GST calculation in real-time
  6. Submit → verify in list
  7. Check dashboard metrics updated

Scenario 2: Bill upload + confirm flow
  1. Login → Click "Upload Bill"
  2. Upload test image
  3. Wait for OCR
  4. Verify extracted fields
  5. Confirm → verify ITC recorded

Scenario 3: GST Summary accuracy
  1. Create 3 invoices (mix of intra/inter state)
  2. Upload 2 bills
  3. Navigate to GST Summary
  4. Verify 3 cards match expected values
  5. Click drill-downs, verify consistency
  6. Click "Why this amount?", verify explanation
```

---

## 8. Performance Test Cases

| Test | Metric | Target |
|------|--------|--------|
| Dashboard load (cold) | FCP | < 2s |
| Dashboard load (warm) | FCP | < 1s |
| Invoice list (100 items) | TTFB | < 200ms |
| Invoice list (1000 items) | TTFB | < 500ms |
| GST Summary compute | TTFB | < 300ms |
| Bill image upload (200KB) | Upload time (3G) | < 5s |
| OCR processing | Total time | < 10s |
| PDF generation | Total time | < 3s |
| JS bundle per page | Size (gzipped) | < 100KB |

---

## 9. Test Data Seeds

```sql
-- Create test business
INSERT INTO businesses (id, user_id, name, gstin, state_code, state_name, business_type, financial_year)
VALUES ('test-biz-001', 'test-user-001', 'Test Hardware Store', '27AABCU9603R1ZP', '27', 'Maharashtra', 'regular', '2025-26');

-- Create test invoices for Feb 2025
-- 3 intra-state, 1 inter-state, different rates
-- Total: 12 invoices with known expected output GST
```
