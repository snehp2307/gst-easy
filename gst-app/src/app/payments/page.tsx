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

    const modeColors: Record<string, string> = {
        upi: 'bg-violet-100 text-violet-700 border-violet-200',
        bank_transfer: 'bg-blue-100 text-blue-700 border-blue-200',
        cash: 'bg-emerald-100 text-emerald-700 border-emerald-200',
        cheque: 'bg-amber-100 text-amber-700 border-amber-200',
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Payments</h2>
                    <p className="text-slate-500 mt-1">{total} total payments</p>
                </div>
                <button className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Record Payment
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-[#10a24b]/10 text-[#10a24b]"><span className="material-symbols-outlined">account_balance_wallet</span></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Received</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{fmt(payments.reduce((s, p) => s + p.amount, 0))}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-blue-100 text-blue-500"><span className="material-symbols-outlined">receipt</span></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">This Month</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">₹{fmt(payments.filter(p => new Date(p.payment_date).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.amount, 0))}</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-500"><span className="material-symbols-outlined">credit_card</span></div>
                    </div>
                    <p className="text-sm font-medium text-slate-500">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{payments.length}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reference</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Recorded</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payments.map(p => (
                            <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{new Date(p.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{fmt(p.amount)}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${modeColors[p.payment_mode] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                                        {p.payment_mode.replace('_', ' ').toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{p.reference_number || '—'}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                        ))}
                        {payments.length === 0 && (
                            <tr><td colSpan={5} className="text-center text-slate-400 py-12">{loading ? 'Loading...' : 'No payments recorded yet'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
