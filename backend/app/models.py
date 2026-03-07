"""
SQLAlchemy ORM Models — All monetary values stored in PAISE (integer).
Multi-tenant SaaS: all business entities include business_id.
"""
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Boolean, Text, Date,
    DateTime, ForeignKey, JSON, Index, UniqueConstraint, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import enum


# ─────────────────────────────────────────
# Enums
# ─────────────────────────────────────────

class UserRole(str, enum.Enum):
    admin = "admin"
    accountant = "accountant"
    staff = "staff"
    ca = "ca"


class InvoiceStatus(str, enum.Enum):
    draft = "draft"
    sent = "sent"
    paid = "paid"
    partially_paid = "partially_paid"
    overdue = "overdue"
    cancelled = "cancelled"


class OcrStatus(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    completed = "completed"
    failed = "failed"


# ─────────────────────────────────────────
# Users & Auth
# ─────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=True)
    phone = Column(String(15), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(20), default="admin")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    businesses = relationship("Business", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    revoked = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("User", back_populates="refresh_tokens")

    __table_args__ = (Index("ix_refresh_tokens_user", "user_id"),)


# ─────────────────────────────────────────
# Business Profile
# ─────────────────────────────────────────

class Business(Base):
    __tablename__ = "businesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), unique=True, nullable=True)
    state_code = Column(String(2), nullable=False)
    state_name = Column(String(50), nullable=False)
    business_type = Column(String(20), default="regular")
    address = Column(Text, nullable=True)
    pincode = Column(String(6), nullable=True)
    phone = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    pan = Column(String(10), nullable=True)
    logo_url = Column(Text, nullable=True)
    financial_year = Column(String(7), nullable=False)
    invoice_prefix = Column(String(20), default="INV-")
    next_invoice_no = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="businesses")
    customers = relationship("Customer", back_populates="business", cascade="all, delete-orphan")
    vendors = relationship("Vendor", back_populates="business", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="business", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="business")
    documents = relationship("Document", back_populates="business", cascade="all, delete-orphan")
    gst_summaries = relationship("GstMonthlySummary", back_populates="business")
    audit_logs = relationship("AuditLog", back_populates="business")

    __table_args__ = (Index("ix_businesses_user_id", "user_id"),)


# ─────────────────────────────────────────
# Customers (Buyers)
# ─────────────────────────────────────────

class Customer(Base):
    __tablename__ = "customers"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), nullable=True)
    state_code = Column(String(2), nullable=True)
    state_name = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(15), nullable=True)
    address = Column(Text, nullable=True)
    pincode = Column(String(6), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="customers")
    invoices = relationship("Invoice", back_populates="customer")

    __table_args__ = (
        Index("ix_customers_business", "business_id"),
        Index("ix_customers_gstin", "gstin"),
    )


# ─────────────────────────────────────────
# Vendors (Suppliers)
# ─────────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), nullable=True)
    state_code = Column(String(2), nullable=True)
    state_name = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(15), nullable=True)
    address = Column(Text, nullable=True)
    pincode = Column(String(6), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="vendors")
    invoices = relationship("Invoice", back_populates="vendor")

    __table_args__ = (
        Index("ix_vendors_business", "business_id"),
        Index("ix_vendors_gstin", "gstin"),
    )


# ─────────────────────────────────────────
# Invoices (Sales + Purchases)
# ─────────────────────────────────────────

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=True)

    invoice_type = Column(String(10), nullable=False)  # 'sale' | 'purchase'
    invoice_number = Column(String(50), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    status = Column(String(20), default="draft")  # draft/sent/paid/partially_paid/overdue/cancelled

    seller_state_code = Column(String(2), nullable=False)
    buyer_state_code = Column(String(2), nullable=False)
    is_inter_state = Column(Boolean, nullable=False)
    place_of_supply = Column(String(2), nullable=False)

    # All amounts in paise (integer)
    total_taxable_value = Column(BigInteger, default=0)
    total_cgst = Column(BigInteger, default=0)
    total_sgst = Column(BigInteger, default=0)
    total_igst = Column(BigInteger, default=0)
    total_amount = Column(BigInteger, default=0)
    round_off = Column(BigInteger, default=0)

    # Purchase bill specifics
    original_image_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    ocr_raw_text = Column(Text, nullable=True)
    ocr_confidence = Column(Float, nullable=True)

    # Status flags
    payment_status = Column(String(15), default="unpaid")
    confidence_score = Column(String(10), default="green")
    itc_status = Column(String(20), default="not_applicable")
    is_locked = Column(Boolean, default=False)
    is_confirmed = Column(Boolean, default=True)
    filing_period = Column(String(7), nullable=True)  # 'YYYY-MM'

    notes = Column(Text, nullable=True)
    terms = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=True)

    business = relationship("Business", back_populates="invoices")
    customer = relationship("Customer", back_populates="invoices")
    vendor = relationship("Vendor", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("business_id", "invoice_type", "invoice_number", "filing_period",
                         name="uq_invoice_number"),
        Index("ix_invoices_biz_type", "business_id", "invoice_type"),
        Index("ix_invoices_biz_date", "business_id", "invoice_date"),
        Index("ix_invoices_biz_period", "business_id", "filing_period"),
        Index("ix_invoices_biz_status", "business_id", "payment_status"),
        Index("ix_invoices_customer", "customer_id"),
        Index("ix_invoices_vendor", "vendor_id"),
    )


# ─────────────────────────────────────────
# Invoice Line Items
# ─────────────────────────────────────────

class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)

    description = Column(String(500), nullable=False)
    hsn_code = Column(String(8), nullable=True)
    quantity = Column(Float, default=1)
    unit = Column(String(20), default="NOS")
    unit_price = Column(BigInteger, nullable=False)  # paise
    discount = Column(BigInteger, default=0)  # paise

    taxable_value = Column(BigInteger, nullable=False)  # paise
    gst_rate = Column(Float, nullable=False)
    cgst_rate = Column(Float, default=0)
    sgst_rate = Column(Float, default=0)
    igst_rate = Column(Float, default=0)
    cgst_amount = Column(BigInteger, default=0)  # paise
    sgst_amount = Column(BigInteger, default=0)
    igst_amount = Column(BigInteger, default=0)
    total_amount = Column(BigInteger, nullable=False)  # paise

    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="items")

    __table_args__ = (
        Index("ix_items_invoice", "invoice_id"),
        Index("ix_items_hsn", "hsn_code"),
    )


# ─────────────────────────────────────────
# Payments
# ─────────────────────────────────────────

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)

    amount = Column(BigInteger, nullable=False)  # paise
    payment_date = Column(Date, nullable=False)
    payment_mode = Column(String(20), nullable=False)
    reference_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=True)

    invoice = relationship("Invoice", back_populates="payments")
    business = relationship("Business", back_populates="payments")

    __table_args__ = (
        Index("ix_payments_invoice", "invoice_id"),
        Index("ix_payments_biz_date", "business_id", "payment_date"),
    )


# ─────────────────────────────────────────
# Documents (File Uploads for OCR)
# ─────────────────────────────────────────

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    filename = Column(String(255), nullable=False)
    file_url = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    document_type = Column(String(20), default="invoice")  # invoice / bill / receipt

    # OCR processing
    ocr_status = Column(String(20), default="pending")  # pending/processing/completed/failed
    ocr_result = Column(JSON, nullable=True)
    ocr_confidence = Column(Float, nullable=True)

    # Linking
    linked_invoice_id = Column(UUID(as_uuid=True), ForeignKey("invoices.id"), nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    business = relationship("Business", back_populates="documents")

    __table_args__ = (
        Index("ix_documents_business", "business_id"),
        Index("ix_documents_ocr_status", "ocr_status"),
    )


# ─────────────────────────────────────────
# GST Monthly Summary
# ─────────────────────────────────────────

class GstMonthlySummary(Base):
    __tablename__ = "gst_monthly_summary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    period = Column(String(7), nullable=False)  # 'YYYY-MM'

    output_cgst = Column(BigInteger, default=0)
    output_sgst = Column(BigInteger, default=0)
    output_igst = Column(BigInteger, default=0)
    output_total = Column(BigInteger, default=0)
    sales_count = Column(Integer, default=0)
    total_taxable_sales = Column(BigInteger, default=0)

    itc_cgst = Column(BigInteger, default=0)
    itc_sgst = Column(BigInteger, default=0)
    itc_igst = Column(BigInteger, default=0)
    itc_total = Column(BigInteger, default=0)
    itc_eligible = Column(BigInteger, default=0)
    itc_needs_review = Column(BigInteger, default=0)
    purchases_count = Column(Integer, default=0)
    total_taxable_purchases = Column(BigInteger, default=0)

    net_cgst = Column(BigInteger, default=0)
    net_sgst = Column(BigInteger, default=0)
    net_igst = Column(BigInteger, default=0)
    net_total = Column(BigInteger, default=0)
    itc_carryforward = Column(BigInteger, default=0)

    return_status = Column(String(20), default="draft")
    is_stale = Column(Boolean, default=False)
    last_computed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="gst_summaries")

    __table_args__ = (
        UniqueConstraint("business_id", "period", name="uq_gst_summary_period"),
        Index("ix_gst_summary_biz", "business_id"),
    )


# ─────────────────────────────────────────
# Audit Log (Append-Only)
# ─────────────────────────────────────────

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    entity_type = Column(String(30), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    action = Column(String(20), nullable=False)
    changes = Column(JSON, default={})
    reason = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    business = relationship("Business", back_populates="audit_logs")
    user = relationship("User", back_populates="audit_logs")

    __table_args__ = (
        Index("ix_audit_entity", "entity_type", "entity_id"),
        Index("ix_audit_biz_time", "business_id", "created_at"),
    )
