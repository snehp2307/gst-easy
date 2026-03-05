# API Endpoints — GST Automation App

Base URL: `/api/v1`  
All requests require `Authorization: Bearer <jwt>` except auth endpoints.  
All monetary values in **paise** (integer). Divide by 100 for rupees.

---

## Authentication

### POST `/auth/register`
```json
// Request
{
  "phone": "9876543210",
  "name": "Ravi Kumar",
  "password": "securePass123"
}

// Response 201
{
  "message": "OTP sent to 9876543210",
  "otpId": "otp_abc123"
}
```

### POST `/auth/verify-otp`
```json
// Request
{ "otpId": "otp_abc123", "otp": "456789" }

// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyBpcyBh...",
  "user": { "id": "uuid", "name": "Ravi Kumar", "phone": "9876543210" }
}
```

### POST `/auth/login`
```json
// Request
{ "phone": "9876543210", "password": "securePass123" }

// Response 200
{
  "accessToken": "eyJhbG...",
  "refreshToken": "dGhpcyBpcyBh...",
  "user": { "id": "uuid", "name": "Ravi Kumar", "role": "owner" }
}
```

### POST `/auth/refresh`
```json
// Request
{ "refreshToken": "dGhpcyBpcyBh..." }
// Response 200
{ "accessToken": "eyJhbG...(new)" }
```

---

## Business Profile

### POST `/businesses`
```json
// Request
{
  "name": "Ravi Hardware Store",
  "gstin": "27AABCU9603R1ZP",
  "businessType": "regular",
  "address": "Shop No 4, MG Road, Pune",
  "pincode": "411001",
  "financialYear": "2025-26",
  "invoicePrefix": "INV-"
}

// Response 201
{
  "id": "biz_uuid",
  "name": "Ravi Hardware Store",
  "gstin": "27AABCU9603R1ZP",
  "stateCode": "27",         // auto-extracted from GSTIN
  "stateName": "Maharashtra", // auto-resolved
  "businessType": "regular",
  "financialYear": "2025-26",
  "invoicePrefix": "INV-",
  "nextInvoiceNo": 1
}
```

### GET `/businesses/:id`
### PUT `/businesses/:id`

---

## Sales Invoices

### POST `/invoices`
Create a sales invoice with auto GST calculation.

```json
// Request
{
  "invoiceType": "sale",
  "invoiceDate": "2025-02-15",
  "buyer": {
    "name": "Sharma Constructions",
    "gstin": "27AADCS1234F1ZP" // optional for B2C
  },
  "items": [
    {
      "description": "Cement (50kg bag)",
      "hsnCode": "2523",
      "quantity": 100,
      "unitPrice": 35000,       // ₹350 in paise
      "gstRate": 28
    },
    {
      "description": "Paint (1L)",
      "hsnCode": "3210",
      "quantity": 20,
      "unitPrice": 25000,       // ₹250 in paise
      "gstRate": 18
    }
  ]
}

// Response 201
{
  "id": "inv_uuid",
  "invoiceNumber": "INV-001",
  "invoiceDate": "2025-02-15",
  "filingPeriod": "2025-02",
  "buyer": {
    "name": "Sharma Constructions",
    "gstin": "27AADCS1234F1ZP",
    "stateCode": "27",
    "stateName": "Maharashtra"
  },
  "isInterState": false,    // same state → CGST+SGST
  "items": [
    {
      "id": "item_uuid_1",
      "description": "Cement (50kg bag)",
      "hsnCode": "2523",
      "quantity": 100,
      "unitPrice": 35000,
      "taxableValue": 3500000,  // 100 × 35000 paise
      "gstRate": 28,
      "cgstRate": 14,
      "sgstRate": 14,
      "igstRate": 0,
      "cgstAmount": 490000,     // ₹4,900
      "sgstAmount": 490000,
      "igstAmount": 0,
      "totalAmount": 4480000    // ₹44,800
    },
    {
      "id": "item_uuid_2",
      "description": "Paint (1L)",
      "hsnCode": "3210",
      "quantity": 20,
      "unitPrice": 25000,
      "taxableValue": 500000,
      "gstRate": 18,
      "cgstRate": 9,
      "sgstRate": 9,
      "igstRate": 0,
      "cgstAmount": 45000,
      "sgstAmount": 45000,
      "igstAmount": 0,
      "totalAmount": 590000
    }
  ],
  "totalTaxableValue": 4000000, // ₹40,000
  "totalCgst": 535000,          // ₹5,350
  "totalSgst": 535000,
  "totalIgst": 0,
  "totalAmount": 5070000,       // ₹50,700
  "roundOff": 0,
  "paymentStatus": "unpaid",
  "confidenceScore": "green",
  "validation": {
    "passed": true,
    "checks": [
      { "rule": "gstin_format", "status": "pass", "message": "GSTIN format valid" },
      { "rule": "gstin_state_code", "status": "pass", "message": "State code 27 matches Maharashtra" },
      { "rule": "tax_math", "status": "pass", "message": "All line item calculations correct" },
      { "rule": "total_check", "status": "pass", "message": "Invoice total matches sum of lines" },
      { "rule": "duplicate_check", "status": "pass", "message": "No duplicate found" },
      { "rule": "place_of_supply", "status": "pass", "message": "Intra-state: CGST+SGST applied correctly" }
    ]
  }
}
```

### GET `/invoices`
List invoices with pagination and filters.

```
GET /invoices?type=sale&period=2025-02&status=unpaid&page=1&limit=20

// Response 200
{
  "data": [ /* array of invoice summaries */ ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true
  }
}
```

### GET `/invoices/:id`
Full invoice detail with line items, validation, payments.

### PUT `/invoices/:id`
Update invoice (creates audit log entry).

### DELETE `/invoices/:id`
Soft delete (creates audit log entry). Not allowed if locked.

---

## Purchase Bills

### POST `/bills/upload`
Upload bill image for OCR processing.

```
POST /bills/upload
Content-Type: multipart/form-data
file: <image_file>

// Response 202 (Accepted — OCR processing)
{
  "id": "bill_uuid",
  "status": "processing",
  "thumbnailUrl": "https://r2.example.com/thumb/bill_uuid.webp",
  "originalUrl": "https://r2.example.com/original/bill_uuid.jpg"
}
```

### GET `/bills/:id/ocr-result`
Get OCR extraction results.

```json
// Response 200
{
  "id": "bill_uuid",
  "status": "review_pending",
  "ocrConfidence": 82.5,
  "extractedFields": {
    "supplierGstin": { "value": "29AABCS5678G1Z4", "confidence": 95.2 },
    "supplierName": { "value": "Steel India Traders", "confidence": 88.1 },
    "invoiceNumber": { "value": "SI/2025/1234", "confidence": 91.0 },
    "invoiceDate": { "value": "2025-02-15", "confidence": 85.3 },
    "taxableValue": { "value": 12000000, "confidence": 78.4 },  // ₹1,20,000 in paise
    "igstAmount": { "value": 2160000, "confidence": 92.1 },
    "totalAmount": { "value": 14160000, "confidence": 89.7 }
  },
  "validation": {
    "gstinValid": true,
    "stateCode": "29",
    "stateName": "Karnataka",
    "isInterState": true,
    "mathCheck": {
      "expected": 2160000,    // 12000000 × 18%
      "extracted": 2160000,
      "matches": true
    }
  },
  "suggestedItcStatus": "eligible",
  "confidenceScore": "yellow"  // yellow because taxable_value confidence < 80
}
```

### PUT `/bills/:id/confirm`
Confirm OCR results (with optional corrections).

```json
// Request
{
  "supplierGstin": "29AABCS5678G1Z4",
  "supplierName": "Steel India Traders",
  "invoiceNumber": "SI/2025/1234",
  "invoiceDate": "2025-02-15",
  "taxableValue": 12000000,
  "gstRate": 18,
  "igstAmount": 2160000,
  "totalAmount": 14160000,
  "itcStatus": "eligible"
}

// Response 200
{
  "id": "bill_uuid",
  "status": "confirmed",
  "confidenceScore": "green",
  "itcStatus": "eligible",
  /* ... full invoice object ... */
}
```

---

## Payments

### POST `/invoices/:id/payments`
```json
// Request
{
  "amount": 5070000,        // ₹50,700 in paise
  "paymentDate": "2025-02-20",
  "paymentMode": "upi",
  "referenceNumber": "1234567890"
}

// Response 201
{
  "id": "pay_uuid",
  "invoiceId": "inv_uuid",
  "amount": 5070000,
  "paymentDate": "2025-02-20",
  "paymentMode": "upi",
  "referenceNumber": "1234567890",
  "invoicePaymentStatus": "paid" // updated status
}
```

---

## GST Summary

### GET `/gst/summary?period=2025-02`
The most important endpoint — powers the GST Summary screen.

```json
// Response 200
{
  "period": "2025-02",
  "businessId": "biz_uuid",

  "outputGst": {
    "cgst": 1820000,       // ₹18,200
    "sgst": 1820000,
    "igst": 200000,        // ₹2,000
    "total": 3840000,      // ₹38,400
    "invoiceCount": 12,
    "totalTaxableSales": 21333333
  },

  "itc": {
    "cgst": 500000,        // ₹5,000
    "sgst": 500000,
    "igst": 2160000,       // ₹21,600
    "total": 3160000,      // ₹31,600
    "eligible": 2860000,   // ₹28,600
    "needsReview": 300000, // ₹3,000
    "blocked": 0,
    "billCount": 8,
    "totalTaxablePurchases": 17555555
  },

  "netPayable": {
    "cgst": 1320000,       // ₹13,200
    "sgst": 1320000,
    "igst": 0,             // fully offset by ITC
    "total": 680000,       // ₹6,800 (after cross-utilization)
    "itcCarryforward": 0,
    "crossUtilization": {
      "igstToIgst": 200000,
      "igstToCgst": 500000,
      "igstToSgst": 500000,
      "remainingIgstCredit": 960000
    }
  },

  "returnStatus": "draft",
  "gstr1DueDate": "2025-03-11",
  "gstr3bDueDate": "2025-03-20",

  "explanation": [
    "You collected ₹38,400 GST from your customers (12 invoices).",
    "You paid ₹31,600 GST on your purchases (8 bills). ₹28,600 is eligible as credit.",
    "Net before cross-utilization: ₹38,400 − ₹28,600 = ₹9,800.",
    "IGST credit (₹21,600) offsets IGST liability (₹2,000), then splits to CGST and SGST.",
    "Final payable: ₹6,800. Due date: 20 March 2025."
  ]
}
```

### GET `/gst/output-gst/by-invoice?period=2025-02`
Drill-down: Output GST broken down by invoice.

```json
// Response 200
{
  "period": "2025-02",
  "total": 3840000,
  "invoices": [
    {
      "invoiceId": "inv_uuid_1",
      "invoiceNumber": "INV-001",
      "invoiceDate": "2025-02-15",
      "buyerName": "Sharma Constructions",
      "cgst": 535000,
      "sgst": 535000,
      "igst": 0,
      "total": 1070000
    }
    // ... more invoices
  ]
}
```

### GET `/gst/output-gst/by-day?period=2025-02`
Drill-down: Output GST aggregated by day.

### GET `/gst/itc/by-supplier?period=2025-02`
Drill-down: ITC broken down by supplier.

### GET `/gst/itc/by-bill?period=2025-02`
Drill-down: ITC broken down by individual bill.

---

## Draft Returns

### GET `/returns/gstr1?period=2025-02`
```json
// Response 200
{
  "period": "2025-02",
  "status": "draft",
  "b2b": [
    {
      "buyerGstin": "27AADCS1234F1ZP",
      "invoiceCount": 3,
      "totalTaxableValue": 8000000,
      "totalCgst": 720000,
      "totalSgst": 720000,
      "totalIgst": 0,
      "invoices": [
        {
          "invoiceNumber": "INV-001",
          "invoiceDate": "2025-02-15",
          "taxableValue": 4000000,
          "cgst": 535000,
          "sgst": 535000,
          "igst": 0,
          "total": 5070000
        }
      ]
    }
  ],
  "b2cs": [
    {
      "stateCode": "27",
      "stateName": "Maharashtra",
      "taxableValue": 8000000,
      "cgst": 720000,
      "sgst": 720000,
      "igst": 0
    }
  ],
  "hsnSummary": [
    {
      "hsnCode": "2523",
      "description": "Cement",
      "quantity": 200,
      "taxableValue": 7000000,
      "cgst": 980000,
      "sgst": 980000,
      "igst": 0
    }
  ],
  "validation": { "passed": true, "errors": [], "warnings": [] }
}
```

### GET `/returns/gstr3b?period=2025-02`
```json
// Response 200
{
  "period": "2025-02",
  "status": "draft",
  "section3_1": {
    "outwardTaxable": {
      "taxableValue": 21333333,
      "cgst": 1820000,
      "sgst": 1820000,
      "igst": 200000
    }
  },
  "section4": {
    "itcAvailable": {
      "cgst": 500000,
      "sgst": 500000,
      "igst": 2160000
    }
  },
  "section6": {
    "taxPayable": {
      "cgst": 1320000,
      "sgst": 1320000,
      "igst": 0
    },
    "paidThroughItc": {
      "cgst": 500000,
      "sgst": 500000,
      "igst": 200000
    },
    "paidInCash": {
      "cgst": 820000,
      "sgst": 820000,
      "igst": 0
    }
  }
}
```

### POST `/returns/:period/lock`
Lock returns for filing.

```json
// Request
{ "period": "2025-02" }

// Response 200
{
  "period": "2025-02",
  "status": "locked",
  "lockedAt": "2025-03-10T14:30:00Z",
  "lockedBy": "user_uuid",
  "validation": { "passed": true }
}
```

### GET `/returns/:period/export?format=pdf`
Export return summary. `format`: `pdf`, `csv`, `json`.

---

## Audit Log

### GET `/audit-log`
```
GET /audit-log?entityType=invoice&entityId=inv_uuid&page=1&limit=50

// Response 200
{
  "data": [
    {
      "id": "audit_uuid",
      "entityType": "invoice",
      "entityId": "inv_uuid",
      "action": "update",
      "changes": {
        "paymentStatus": { "old": "unpaid", "new": "paid" }
      },
      "userName": "Ravi Kumar",
      "createdAt": "2025-02-20T14:30:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 3 }
}
```

---

## Notifications

### GET `/notifications?unreadOnly=true`
### PUT `/notifications/:id/read`

---

## Validation (Standalone)

### POST `/validate/gstin`
```json
// Request
{ "gstin": "27AABCU9603R1ZP" }

// Response 200
{
  "valid": true,
  "stateCode": "27",
  "stateName": "Maharashtra",
  "panInGstin": "AABCU9603R",
  "entityType": "Company",
  "checksumValid": true
}
```

### POST `/validate/invoice`
Run full validation on an invoice payload without saving it.

---

## Error Response Format

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "message": "Invoice validation failed",
  "details": [
    { "field": "items[0].gstRate", "message": "GST rate must be one of: 0, 5, 12, 18, 28" },
    { "field": "buyer.gstin", "message": "GSTIN checksum invalid" }
  ]
}
```
