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
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const fmt = formatPaiseClient;

    useEffect(() => {
        const params = filter !== 'all' ? `&payment_status=${filter}` : '';
        apiFetch(`/invoices?invoice_type=sale${params}`)
            .then(data => { setInvoices(data.invoices || []); setTotal(data.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [filter]);

    const filtered = invoices.filter(inv =>
        !search || inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        (inv.customer_name || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Invoices</h2>
                    <p className="text-slate-500 mt-1">{total} total invoices</p>
                </div>
                <Link
                    href="/invoices/create"
                    className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm no-underline"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Create Invoice
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[300px] relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#10a24b]/20 outline-none"
                        placeholder="Search invoice, customer, or amount..."
                    />
                </div>
                <div className="flex items-center gap-2">
                    {[
                        { label: 'All Statuses', value: 'all' },
                        { label: 'Paid', value: 'paid' },
                        { label: 'Pending', value: 'unpaid' },
                        { label: 'Overdue', value: 'overdue' },
                    ].map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.value
                                    ? 'bg-[#10a24b] text-white'
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice #</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GST (18%)</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filtered.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold text-[#10a24b]">{inv.invoice_number}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#10a24b]/10 text-[#10a24b] flex items-center justify-center text-xs font-bold">
                                                {(inv.customer_name || '?')[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-slate-900">{inv.customer_name || '—'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{fmt(inv.total_amount)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">₹{fmt(inv.total_cgst + inv.total_sgst + inv.total_igst)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${inv.payment_status === 'paid'
                                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                                : inv.payment_status === 'overdue'
                                                    ? 'bg-red-100 text-red-800 border-red-200'
                                                    : 'bg-amber-100 text-amber-800 border-amber-200'
                                            }`}>
                                            {inv.payment_status.charAt(0).toUpperCase() + inv.payment_status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1 text-slate-400 hover:text-[#10a24b] transition-colors"><span className="material-symbols-outlined text-lg">visibility</span></button>
                                            <button className="p-1 text-slate-400 hover:text-[#10a24b] transition-colors"><span className="material-symbols-outlined text-lg">download</span></button>
                                            <button className="p-1 text-slate-400 hover:text-[#10a24b] transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center text-slate-400 py-12">
                                        {loading ? 'Loading...' : 'No invoices found'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-medium">1</span> to <span className="font-medium">{filtered.length}</span> of <span className="font-medium">{total}</span> invoices
                    </p>
                    <div className="flex items-center gap-2">
                        <button disabled className="p-2 border border-slate-200 rounded-lg text-slate-400 disabled:opacity-50">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#10a24b] text-white text-sm font-medium">1</button>
                        <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:bg-white">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Footer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#10a24b]/5 border border-[#10a24b]/10 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-[#10a24b]/20 rounded-lg text-[#10a24b]">
                        <span className="material-symbols-outlined">account_balance</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-[#10a24b] uppercase tracking-tight">Total Collected</p>
                        <p className="text-xl font-bold text-slate-900">₹{fmt(invoices.filter(i => i.payment_status === 'paid').reduce((s, i) => s + i.total_amount, 0))}</p>
                    </div>
                </div>
                <div className="bg-amber-500/5 border border-amber-500/10 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-amber-500/20 rounded-lg text-amber-600">
                        <span className="material-symbols-outlined">pending_actions</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-tight">Outstanding</p>
                        <p className="text-xl font-bold text-slate-900">₹{fmt(invoices.filter(i => i.payment_status !== 'paid').reduce((s, i) => s + i.total_amount, 0))}</p>
                    </div>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-xl flex items-center gap-4">
                    <div className="p-3 bg-blue-500/20 rounded-lg text-blue-600">
                        <span className="material-symbols-outlined">trending_up</span>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-tight">GST Liability</p>
                        <p className="text-xl font-bold text-slate-900">₹{fmt(invoices.reduce((s, i) => s + i.total_cgst + i.total_sgst + i.total_igst, 0))}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
