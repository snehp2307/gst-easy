'use client';

import { useState, useEffect } from 'react';
import { formatPaiseClient } from '@/lib/api-helpers';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('gst_token') : null; }
async function apiFetch(path: string) {
    const token = getToken();
    const res = await fetch(`${API}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
}

interface Payment { id: string; invoice_id: string; amount: number; payment_date: string; payment_mode: string; reference_number: string | null; created_at: string; }

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const fmt = formatPaiseClient;

    useEffect(() => {
        apiFetch('/payments')
            .then(d => { setPayments(d.payments || []); setTotal(d.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Payments</h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>{total} total payments</p>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th><th>Recorded</th></tr></thead>
                    <tbody>
                        {payments.map(p => (
                            <tr key={p.id}>
                                <td>{new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td style={{ fontWeight: 700 }}>₹{fmt(p.amount)}</td>
                                <td><span className="badge badge-blue">{p.payment_mode}</span></td>
                                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{p.reference_number || '—'}</td>
                                <td style={{ color: '#64748b', fontSize: '13px' }}>
                                    {new Date(p.created_at).toLocaleDateString('en-IN')}
                                </td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>{loading ? 'Loading...' : 'No payments recorded yet'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
