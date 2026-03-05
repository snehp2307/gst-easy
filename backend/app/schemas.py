"""
Pydantic request/response schemas for all API endpoints.
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime


# ─────────────────────────────────────────
# Auth
# ─────────────────────────────────────────

class RegisterRequest(BaseModel):
    phone: str = Field(..., min_length=10, max_length=15)
    password: str = Field(..., min_length=6)
    name: str = Field(..., min_length=1)
    email: Optional[str] = None


class LoginRequest(BaseModel):
    phone: str
    password: str


class BusinessSetupRequest(BaseModel):
    name: str
    gstin: str = Field(..., min_length=15, max_length=15)
    state_code: str = Field(..., min_length=2, max_length=2)
    state_name: str
    business_type: str = "regular"
    address: Optional[str] = None
    pincode: Optional[str] = None
    financial_year: str = "2025-26"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    name: str


# ─────────────────────────────────────────
# Invoices
# ─────────────────────────────────────────

class InvoiceItemCreate(BaseModel):
    description: str
    hsn_code: Optional[str] = None
    quantity: float = 1
    unit_price: int  # paise
    gst_rate: float
    discount: int = 0  # paise


class InvoiceCreate(BaseModel):
    buyer_name: str
    buyer_gstin: Optional[str] = None
    buyer_state_code: Optional[str] = None
    invoice_date: date
    due_date: Optional[date] = None
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None


class InvoiceItemResponse(BaseModel):
    id: str
    description: str
    hsn_code: Optional[str]
    quantity: float
    unit_price: int
    taxable_value: int
    gst_rate: float
    cgst_amount: int
    sgst_amount: int
    igst_amount: int
    total_amount: int

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    id: str
    invoice_type: str
    invoice_number: str
    invoice_date: date
    party_name: Optional[str] = None
    party_gstin: Optional[str] = None
    is_inter_state: bool
    total_taxable_value: int
    total_cgst: int
    total_sgst: int
    total_igst: int
    total_amount: int
    payment_status: str
    confidence_score: str
    items: Optional[List[InvoiceItemResponse]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InvoiceListResponse(BaseModel):
    invoices: List[InvoiceResponse]
    total: int
    page: int
    page_size: int


# ─────────────────────────────────────────
# Bills (Purchase)
# ─────────────────────────────────────────

class BillConfirmRequest(BaseModel):
    supplier_name: str
    supplier_gstin: Optional[str] = None
    invoice_number: str
    invoice_date: date
    taxable_value: int  # paise
    cgst_amount: int = 0
    sgst_amount: int = 0
    igst_amount: int = 0
    total_amount: int
    gst_rate: float = 18
    notes: Optional[str] = None


class OcrResult(BaseModel):
    fields: dict
    raw_text: str
    confidence: float
    confidence_score: str  # green/yellow/red


# ─────────────────────────────────────────
# Payments
# ─────────────────────────────────────────

class PaymentCreate(BaseModel):
    invoice_id: str
    amount: int  # paise
    payment_date: date
    payment_mode: str
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    amount: int
    payment_date: date
    payment_mode: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────
# GST Summary
# ─────────────────────────────────────────

class GstBreakupResponse(BaseModel):
    cgst: int
    sgst: int
    igst: int
    total: int


class GstSummaryResponse(BaseModel):
    period: str
    output_gst: GstBreakupResponse
    itc: GstBreakupResponse
    net_payable: GstBreakupResponse
    itc_carryforward: int
    sales_count: int
    purchases_count: int
    total_taxable_sales: int
    total_taxable_purchases: int
    explanation: List[str]
    return_status: str
