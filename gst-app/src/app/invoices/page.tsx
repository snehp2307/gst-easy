'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listInvoices, formatPaiseClient } from '@/lib/api-helpers';
import type { Invoice, InvoiceListResponse } from '@/lib/api';

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const pageSize = 20;

    useEffect(() => {
        setLoading(true);
        listInvoices({
            invoice_type: 'sale',
            payment_status: filter !== 'all' ? filter : undefined,
            search: search || undefined,
            page,
            page_size: pageSize,
        })
            .then((data: InvoiceListResponse) => {
                setInvoices(data.invoices);
                setTotal(data.total);
            })
            .catch(() => {
                setInvoices([]);
                setTotal(0);
            })
            .finally(() => setLoading(false));
    }, [page, filter, search]);

    const fmt = formatPaiseClient;
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ padding: '16px' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '12px' }}>Invoices</h1>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <input
                        className="form-input"
                        placeholder="🔍 Search invoices..."
                        value={search}
                        onChange={e => { setSearch(e.target.value); setPage(1); }}
                        style={{ paddingLeft: '12px' }}
                    />
                </div>

                {/* Filter Chips */}
                <div className="filter-chips">
                    {[
                        { key: 'all', label: 'All' },
                        { key: 'paid', label: '✅ Paid' },
                        { key: 'unpaid', label: '🔴 Unpaid' },
                        { key: 'partial', label: '🟡 Partial' },
                    ].map(f => (
                        <button
                            key={f.key}
                            className={`chip ${filter === f.key ? 'active' : ''}`}
                            onClick={() => { setFilter(f.key); setPage(1); }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoice List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
            ) : invoices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>No invoices yet</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Create your first invoice to get started
                    </div>
                </div>
            ) : (
                <div className="card" style={{ margin: '0 16px', padding: 0 }}>
                    {invoices.map(inv => (
                        <div key={inv.id} className="invoice-card">
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                    <span className={`confidence-dot confidence-${inv.confidence_score}`} />
                                    <span className="invoice-party">{inv.party_name || 'Cash Customer'}</span>
                                </div>
                                <div className="invoice-meta">
                                    {inv.invoice_number} • {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {' • '}
                                    <span style={{ fontSize: '10px', color: inv.is_inter_state ? 'var(--secondary)' : 'var(--text-muted)' }}>
                                        {inv.is_inter_state ? 'IGST' : 'CGST+SGST'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <div className="invoice-amount">₹{fmt(inv.total_amount)}</div>
                                <span className={`badge badge-${inv.payment_status === 'paid' ? 'green' : inv.payment_status === 'partial' ? 'yellow' : 'red'}`}>
                                    {inv.payment_status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '16px' }}>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        ← Prev
                    </button>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        Page {page} of {totalPages} ({total} total)
                    </span>
                    <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* FAB */}
            <Link href="/invoices/new" className="fab" style={{ textDecoration: 'none' }}>+</Link>

            <div style={{ paddingBottom: '100px' }} />
        </div>
    );
}
