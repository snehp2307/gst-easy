"""
SQLAlchemy ORM Models — All monetary values stored in PAISE (integer).
"""
import uuid
from datetime import datetime, date
from sqlalchemy import (
    Column, String, Integer, BigInteger, Float, Boolean, Text, Date,
    DateTime, ForeignKey, JSON, Index, UniqueConstraint
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base


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
    role = Column(String(20), default="owner")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    businesses = relationship("Business", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")


# ─────────────────────────────────────────
# Business Profile
# ─────────────────────────────────────────

class Business(Base):
    __tablename__ = "businesses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), unique=True, nullable=False)
    state_code = Column(String(2), nullable=False)
    state_name = Column(String(50), nullable=False)
    business_type = Column(String(20), default="regular")
    address = Column(Text, nullable=True)
    pincode = Column(String(6), nullable=True)
    phone = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    pan = Column(String(10), nullable=True)
    financial_year = Column(String(7), nullable=False)
    invoice_prefix = Column(String(20), default="INV-")
    next_invoice_no = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="businesses")
    parties = relationship("Party", back_populates="business", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="business", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="business")
    gst_summaries = relationship("GstMonthlySummary", back_populates="business")
    audit_logs = relationship("AuditLog", back_populates="business")

    __table_args__ = (Index("ix_businesses_user_id", "user_id"),)


# ─────────────────────────────────────────
# Parties (Customers / Suppliers)
# ─────────────────────────────────────────

class Party(Base):
    __tablename__ = "parties"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    gstin = Column(String(15), nullable=True)
    state_code = Column(String(2), nullable=True)
    state_name = Column(String(50), nullable=True)
    party_type = Column(String(10), nullable=False)  # 'customer' | 'supplier'
    address = Column(Text, nullable=True)
    phone = Column(String(15), nullable=True)
    email = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    business = relationship("Business", back_populates="parties")
    invoices = relationship("Invoice", back_populates="party")

    __table_args__ = (
        Index("ix_parties_business_id", "business_id"),
        Index("ix_parties_gstin", "gstin"),
        Index("ix_parties_biz_type", "business_id", "party_type"),
    )


# ─────────────────────────────────────────
# Invoices (Sales + Purchases)
# ─────────────────────────────────────────

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    party_id = Column(UUID(as_uuid=True), ForeignKey("parties.id"), nullable=True)

    invoice_type = Column(String(10), nullable=False)  # 'sale' | 'purchase'
    invoice_number = Column(String(50), nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)

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

    # Status
    payment_status = Column(String(15), default="unpaid")
    confidence_score = Column(String(10), default="green")
    itc_status = Column(String(20), default="not_applicable")
    is_locked = Column(Boolean, default=False)
    is_confirmed = Column(Boolean, default=True)
    filing_period = Column(String(7), nullable=True)  # 'YYYY-MM'

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(UUID(as_uuid=True), nullable=True)

    business = relationship("Business", back_populates="invoices")
    party = relationship("Party", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("business_id", "invoice_type", "invoice_number", "filing_period",
                         name="uq_invoice_number"),
        Index("ix_invoices_biz_type", "business_id", "invoice_type"),
        Index("ix_invoices_biz_date", "business_id", "invoice_date"),
        Index("ix_invoices_biz_period", "business_id", "filing_period"),
        Index("ix_invoices_biz_status", "business_id", "payment_status"),
        Index("ix_invoices_party", "party_id"),
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
# GST Monthly Summary
# ─────────────────────────────────────────

class GstMonthlySummary(Base):
    __tablename__ = "gst_monthly_summary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False)
    period = Column(String(7), nullable=False)  # 'YYYY-MM'

    # Output GST
    output_cgst = Column(BigInteger, default=0)
    output_sgst = Column(BigInteger, default=0)
    output_igst = Column(BigInteger, default=0)
    output_total = Column(BigInteger, default=0)
    sales_count = Column(Integer, default=0)
    total_taxable_sales = Column(BigInteger, default=0)

    # ITC
    itc_cgst = Column(BigInteger, default=0)
    itc_sgst = Column(BigInteger, default=0)
    itc_igst = Column(BigInteger, default=0)
    itc_total = Column(BigInteger, default=0)
    itc_eligible = Column(BigInteger, default=0)
    itc_needs_review = Column(BigInteger, default=0)
    purchases_count = Column(Integer, default=0)
    total_taxable_purchases = Column(BigInteger, default=0)

    # Net Payable
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
