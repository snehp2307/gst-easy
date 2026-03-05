"""Initial schema — all 9 tables

Revision ID: 001
Revises:
Create Date: 2025-03-05
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Users
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=True),
        sa.Column('phone', sa.String(15), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), server_default='owner'),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    # Businesses
    op.create_table('businesses',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('gstin', sa.String(15), unique=True, nullable=False),
        sa.Column('state_code', sa.String(2), nullable=False),
        sa.Column('state_name', sa.String(50), nullable=False),
        sa.Column('business_type', sa.String(20), server_default='regular'),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('pincode', sa.String(6), nullable=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('pan', sa.String(10), nullable=True),
        sa.Column('financial_year', sa.String(7), nullable=False),
        sa.Column('invoice_prefix', sa.String(20), server_default='INV-'),
        sa.Column('next_invoice_no', sa.Integer, server_default='1'),
        sa.Column('is_active', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_businesses_user_id', 'businesses', ['user_id'])

    # Parties
    op.create_table('parties',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('gstin', sa.String(15), nullable=True),
        sa.Column('state_code', sa.String(2), nullable=True),
        sa.Column('state_name', sa.String(50), nullable=True),
        sa.Column('party_type', sa.String(10), nullable=False),
        sa.Column('address', sa.Text, nullable=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_parties_business_id', 'parties', ['business_id'])
    op.create_index('ix_parties_gstin', 'parties', ['gstin'])
    op.create_index('ix_parties_biz_type', 'parties', ['business_id', 'party_type'])

    # Invoices
    op.create_table('invoices',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('party_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('parties.id'), nullable=True),
        sa.Column('invoice_type', sa.String(10), nullable=False),
        sa.Column('invoice_number', sa.String(50), nullable=False),
        sa.Column('invoice_date', sa.Date, nullable=False),
        sa.Column('due_date', sa.Date, nullable=True),
        sa.Column('seller_state_code', sa.String(2), nullable=False),
        sa.Column('buyer_state_code', sa.String(2), nullable=False),
        sa.Column('is_inter_state', sa.Boolean, nullable=False),
        sa.Column('place_of_supply', sa.String(2), nullable=False),
        sa.Column('total_taxable_value', sa.BigInteger, server_default='0'),
        sa.Column('total_cgst', sa.BigInteger, server_default='0'),
        sa.Column('total_sgst', sa.BigInteger, server_default='0'),
        sa.Column('total_igst', sa.BigInteger, server_default='0'),
        sa.Column('total_amount', sa.BigInteger, server_default='0'),
        sa.Column('round_off', sa.BigInteger, server_default='0'),
        sa.Column('original_image_url', sa.Text, nullable=True),
        sa.Column('thumbnail_url', sa.Text, nullable=True),
        sa.Column('ocr_raw_text', sa.Text, nullable=True),
        sa.Column('ocr_confidence', sa.Float, nullable=True),
        sa.Column('payment_status', sa.String(15), server_default='unpaid'),
        sa.Column('confidence_score', sa.String(10), server_default='green'),
        sa.Column('itc_status', sa.String(20), server_default='not_applicable'),
        sa.Column('is_locked', sa.Boolean, server_default='false'),
        sa.Column('is_confirmed', sa.Boolean, server_default='true'),
        sa.Column('filing_period', sa.String(7), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.UniqueConstraint('business_id', 'invoice_type', 'invoice_number', 'filing_period', name='uq_invoice_number'),
    )
    op.create_index('ix_invoices_biz_type', 'invoices', ['business_id', 'invoice_type'])
    op.create_index('ix_invoices_biz_date', 'invoices', ['business_id', 'invoice_date'])
    op.create_index('ix_invoices_biz_period', 'invoices', ['business_id', 'filing_period'])
    op.create_index('ix_invoices_biz_status', 'invoices', ['business_id', 'payment_status'])
    op.create_index('ix_invoices_party', 'invoices', ['party_id'])

    # Invoice Items
    op.create_table('invoice_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('description', sa.String(500), nullable=False),
        sa.Column('hsn_code', sa.String(8), nullable=True),
        sa.Column('quantity', sa.Float, server_default='1'),
        sa.Column('unit', sa.String(20), server_default="'NOS'"),
        sa.Column('unit_price', sa.BigInteger, nullable=False),
        sa.Column('discount', sa.BigInteger, server_default='0'),
        sa.Column('taxable_value', sa.BigInteger, nullable=False),
        sa.Column('gst_rate', sa.Float, nullable=False),
        sa.Column('cgst_rate', sa.Float, server_default='0'),
        sa.Column('sgst_rate', sa.Float, server_default='0'),
        sa.Column('igst_rate', sa.Float, server_default='0'),
        sa.Column('cgst_amount', sa.BigInteger, server_default='0'),
        sa.Column('sgst_amount', sa.BigInteger, server_default='0'),
        sa.Column('igst_amount', sa.BigInteger, server_default='0'),
        sa.Column('total_amount', sa.BigInteger, nullable=False),
        sa.Column('sort_order', sa.Integer, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_items_invoice', 'invoice_items', ['invoice_id'])
    op.create_index('ix_items_hsn', 'invoice_items', ['hsn_code'])

    # Payments
    op.create_table('payments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('invoice_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('invoices.id', ondelete='CASCADE'), nullable=False),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('businesses.id'), nullable=False),
        sa.Column('amount', sa.BigInteger, nullable=False),
        sa.Column('payment_date', sa.Date, nullable=False),
        sa.Column('payment_mode', sa.String(20), nullable=False),
        sa.Column('reference_number', sa.String(100), nullable=True),
        sa.Column('notes', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('created_by', postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index('ix_payments_invoice', 'payments', ['invoice_id'])
    op.create_index('ix_payments_biz_date', 'payments', ['business_id', 'payment_date'])

    # GST Monthly Summary
    op.create_table('gst_monthly_summary',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('businesses.id'), nullable=False),
        sa.Column('period', sa.String(7), nullable=False),
        sa.Column('output_cgst', sa.BigInteger, server_default='0'),
        sa.Column('output_sgst', sa.BigInteger, server_default='0'),
        sa.Column('output_igst', sa.BigInteger, server_default='0'),
        sa.Column('output_total', sa.BigInteger, server_default='0'),
        sa.Column('sales_count', sa.Integer, server_default='0'),
        sa.Column('total_taxable_sales', sa.BigInteger, server_default='0'),
        sa.Column('itc_cgst', sa.BigInteger, server_default='0'),
        sa.Column('itc_sgst', sa.BigInteger, server_default='0'),
        sa.Column('itc_igst', sa.BigInteger, server_default='0'),
        sa.Column('itc_total', sa.BigInteger, server_default='0'),
        sa.Column('itc_eligible', sa.BigInteger, server_default='0'),
        sa.Column('itc_needs_review', sa.BigInteger, server_default='0'),
        sa.Column('purchases_count', sa.Integer, server_default='0'),
        sa.Column('total_taxable_purchases', sa.BigInteger, server_default='0'),
        sa.Column('net_cgst', sa.BigInteger, server_default='0'),
        sa.Column('net_sgst', sa.BigInteger, server_default='0'),
        sa.Column('net_igst', sa.BigInteger, server_default='0'),
        sa.Column('net_total', sa.BigInteger, server_default='0'),
        sa.Column('itc_carryforward', sa.BigInteger, server_default='0'),
        sa.Column('return_status', sa.String(20), server_default='draft'),
        sa.Column('is_stale', sa.Boolean, server_default='false'),
        sa.Column('last_computed_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.UniqueConstraint('business_id', 'period', name='uq_gst_summary_period'),
    )
    op.create_index('ix_gst_summary_biz', 'gst_monthly_summary', ['business_id'])

    # Audit Logs
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('businesses.id'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('entity_type', sa.String(30), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('action', sa.String(20), nullable=False),
        sa.Column('changes', postgresql.JSON, server_default='{}'),
        sa.Column('reason', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_audit_entity', 'audit_logs', ['entity_type', 'entity_id'])
    op.create_index('ix_audit_biz_time', 'audit_logs', ['business_id', 'created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('gst_monthly_summary')
    op.drop_table('payments')
    op.drop_table('invoice_items')
    op.drop_table('invoices')
    op.drop_table('parties')
    op.drop_table('businesses')
    op.drop_table('users')
