'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatPaiseClient } from '@/lib/api-helpers';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('gst_token');
}

async function apiFetch(path: string) {
    const token = getToken();
    const res = await fetch(`${API}${path}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
}

interface Invoice {
    id: string;
    invoice_number: string;
    customer_name: string | null;
    invoice_date: string;
    total_amount: number;
    total_cgst: number;
    total_sgst: number;
    total_igst: number;
    payment_status: string;
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const fmt = formatPaiseClient;

    useEffect(() => {
        const params = filter !== 'all' ? `&payment_status=${filter}` : '';
        apiFetch(`/invoices?invoice_type=sale${params}`)
            .then(data => { setInvoices(data.invoices || []); setTotal(data.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [filter]);

    const filters = [
        { label: 'All', value: 'all' },
        { label: 'Paid', value: 'paid' },
        { label: 'Pending', value: 'unpaid' },
        { label: 'Overdue', value: 'overdue' },
    ];

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Invoices</h2>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>{total} total invoices</p>
                </div>
                <Link href="/invoices/new" className="btn-primary" style={{ textDecoration: 'none' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    Create Invoice
                </Link>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                {filters.map(f => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        style={{
                            padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                            border: filter === f.value ? 'none' : '1px solid #e2e8f0',
                            background: filter === f.value ? '#10a24b' : '#fff',
                            color: filter === f.value ? '#fff' : '#475569',
                            cursor: 'pointer',
                        }}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Invoice #</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>GST (18%)</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoices.map(inv => (
                            <tr key={inv.id}>
                                <td style={{ fontWeight: 500 }}>{inv.invoice_number}</td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            background: '#f1f5f9', display: 'flex', alignItems: 'center',
                                            justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#64748b',
                                        }}>
                                            {(inv.customer_name || '?')[0].toUpperCase()}
                                        </div>
                                        {inv.customer_name || '—'}
                                    </div>
                                </td>
                                <td style={{ color: '#64748b' }}>
                                    {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td style={{ fontWeight: 700 }}>₹{fmt(inv.total_amount)}</td>
                                <td style={{ color: '#10a24b', fontWeight: 500 }}>
                                    ₹{fmt(inv.total_cgst + inv.total_sgst + inv.total_igst)}
                                </td>
                                <td>
                                    <span className={`badge ${inv.payment_status === 'paid' ? 'badge-green' : inv.payment_status === 'overdue' ? 'badge-red' : 'badge-orange'}`}>
                                        {inv.payment_status.charAt(0).toUpperCase() + inv.payment_status.slice(1)}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                                        </button>
                                        <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span>
                                        </button>
                                        <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {invoices.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>
                                    {loading ? 'Loading...' : 'No invoices found'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
