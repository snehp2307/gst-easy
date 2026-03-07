"""SaaS architecture upgrade — new tables and columns

Revision ID: 003
Revises: 002
Create Date: 2026-03-07
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ── Users: add role and is_active ──
    op.add_column('users', sa.Column('role', sa.String(20), server_default='admin'))
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default='true'))

    # ── Businesses: add new columns ──
    op.add_column('businesses', sa.Column('phone', sa.String(15), nullable=True))
    op.add_column('businesses', sa.Column('email', sa.String(255), nullable=True))
    op.add_column('businesses', sa.Column('pan', sa.String(10), nullable=True))
    op.add_column('businesses', sa.Column('logo_url', sa.Text(), nullable=True))
    op.add_column('businesses', sa.Column('invoice_prefix', sa.String(20), server_default='INV-'))
    op.add_column('businesses', sa.Column('next_invoice_no', sa.Integer(), server_default='1'))
    op.add_column('businesses', sa.Column('is_active', sa.Boolean(), server_default='true'))

    # ── Refresh Tokens ──
    op.create_table(
        'refresh_tokens',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('token_hash', sa.String(255), nullable=False, unique=True),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('revoked', sa.Boolean(), server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_refresh_tokens_user', 'refresh_tokens', ['user_id'])

    # ── Customers ──
    op.create_table(
        'customers',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', UUID(as_uuid=True), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('gstin', sa.String(15), nullable=True),
        sa.Column('state_code', sa.String(2), nullable=True),
        sa.Column('state_name', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('pincode', sa.String(6), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_customers_business', 'customers', ['business_id'])
    op.create_index('ix_customers_gstin', 'customers', ['gstin'])

    # ── Vendors ──
    op.create_table(
        'vendors',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', UUID(as_uuid=True), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('gstin', sa.String(15), nullable=True),
        sa.Column('state_code', sa.String(2), nullable=True),
        sa.Column('state_name', sa.String(50), nullable=True),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(15), nullable=True),
        sa.Column('address', sa.Text(), nullable=True),
        sa.Column('pincode', sa.String(6), nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_vendors_business', 'vendors', ['business_id'])
    op.create_index('ix_vendors_gstin', 'vendors', ['gstin'])

    # ── Invoices: add FKs and new columns ──
    op.add_column('invoices', sa.Column('customer_id', UUID(as_uuid=True), nullable=True))
    op.add_column('invoices', sa.Column('vendor_id', UUID(as_uuid=True), nullable=True))
    op.add_column('invoices', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('invoices', sa.Column('terms', sa.Text(), nullable=True))
    op.create_foreign_key('fk_invoices_customer', 'invoices', 'customers', ['customer_id'], ['id'])
    op.create_foreign_key('fk_invoices_vendor', 'invoices', 'vendors', ['vendor_id'], ['id'])

    # ── Documents ──
    op.create_table(
        'documents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('business_id', UUID(as_uuid=True), sa.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('uploaded_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('filename', sa.String(255), nullable=False),
        sa.Column('file_url', sa.Text(), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(100), nullable=True),
        sa.Column('document_type', sa.String(20), server_default='invoice'),
        sa.Column('ocr_status', sa.String(20), server_default='pending'),
        sa.Column('ocr_result', sa.JSON(), nullable=True),
        sa.Column('ocr_confidence', sa.Float(), nullable=True),
        sa.Column('linked_invoice_id', UUID(as_uuid=True), sa.ForeignKey('invoices.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('ix_documents_business', 'documents', ['business_id'])
    op.create_index('ix_documents_ocr_status', 'documents', ['ocr_status'])


def downgrade() -> None:
    op.drop_table('documents')
    op.drop_constraint('fk_invoices_vendor', 'invoices')
    op.drop_constraint('fk_invoices_customer', 'invoices')
    op.drop_column('invoices', 'terms')
    op.drop_column('invoices', 'notes')
    op.drop_column('invoices', 'vendor_id')
    op.drop_column('invoices', 'customer_id')
    op.drop_table('vendors')
    op.drop_table('customers')
    op.drop_table('refresh_tokens')
    op.drop_column('businesses', 'is_active')
    op.drop_column('businesses', 'next_invoice_no')
    op.drop_column('businesses', 'invoice_prefix')
    op.drop_column('businesses', 'logo_url')
    op.drop_column('businesses', 'pan')
    op.drop_column('businesses', 'email')
    op.drop_column('businesses', 'phone')
    op.drop_column('users', 'is_active')
    op.drop_column('users', 'role')
