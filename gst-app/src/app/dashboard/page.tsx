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

interface DashSummary {
    total_revenue: number;
    total_expenses: number;
    gst_payable: number;
    outstanding_payments: number;
}

interface MonthlyRevenue {
    month: string;
    revenue: number;
}

interface RecentInvoice {
    id: string;
    invoice_number: string;
    customer_name: string | null;
    invoice_date: string;
    total_amount: number;
    status: string;
}

export default function DashboardPage() {
    const [summary, setSummary] = useState<DashSummary | null>(null);
    const [chart, setChart] = useState<MonthlyRevenue[]>([]);
    const [recent, setRecent] = useState<RecentInvoice[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            apiFetch('/analytics/summary').catch(() => null),
            apiFetch('/analytics/charts').catch(() => ({ monthly_revenue: [] })),
            apiFetch('/analytics/recent-invoices?limit=5').catch(() => []),
        ]).then(([sum, charts, inv]) => {
            setSummary(sum);
            setChart(charts?.monthly_revenue || []);
            setRecent(inv || []);
        }).finally(() => setLoading(false));
    }, []);

    const fmt = formatPaiseClient;
    const maxRev = Math.max(...chart.map(c => c.revenue), 1);

    const stats = [
        { label: 'Total Revenue', value: summary?.total_revenue ?? 0, icon: 'trending_up', iconBg: 'bg-[#10a24b]/10 text-[#10a24b]', badge: '+12.5%', badgeColor: 'bg-green-100 text-green-700' },
        { label: 'Total Expenses', value: summary?.total_expenses ?? 0, icon: 'shopping_cart', iconBg: 'bg-slate-100 text-slate-600', badge: '-4.2%', badgeColor: 'bg-red-100 text-red-700' },
        { label: 'GST Payable', value: summary?.gst_payable ?? 0, icon: 'account_balance', iconBg: 'bg-[#10a24b]/10 text-[#10a24b]', badge: '+2.1%', badgeColor: 'bg-green-100 text-green-700' },
        { label: 'Outstanding Payments', value: summary?.outstanding_payments ?? 0, icon: 'pending_actions', iconBg: 'bg-orange-100 text-orange-600', badge: '-8.4%', badgeColor: 'bg-red-100 text-red-700' },
    ];

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Financial Overview</h2>
                <p className="text-slate-500 mt-1">
                    Dashboard status for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((s) => (
                    <div key={s.label} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2 rounded-lg ${s.iconBg}`}>
                                <span className="material-symbols-outlined">{s.icon}</span>
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${s.badgeColor}`}>{s.badge}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-500">{s.label}</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">₹{fmt(s.value)}</p>
                    </div>
                ))}
            </div>

            {/* Chart + Filing Status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Monthly Revenue Overview</h3>
                            <p className="text-sm text-slate-500">Comparison of last 6 months</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-xs font-medium bg-slate-100 rounded-lg">Last 6 Months</button>
                            <button className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Annual</button>
                        </div>
                    </div>
                    <div className="relative h-64 flex items-end justify-between gap-4 px-4">
                        {chart.map((item, i) => (
                            <div key={i} className="flex-1 group relative">
                                <div
                                    className="bg-[#10a24b]/20 group-hover:bg-[#10a24b]/30 rounded-t-lg w-full transition-all duration-300"
                                    style={{ height: `${Math.max(4, (item.revenue / maxRev) * 100)}%` }}
                                />
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap">
                                    ₹{fmt(item.revenue)}
                                </div>
                                <p className="text-xs text-slate-500 mt-3 text-center">{item.month}</p>
                            </div>
                        ))}
                        {chart.length === 0 && (
                            <p className="text-slate-400 text-center w-full py-16">No revenue data yet</p>
                        )}
                    </div>
                </div>

                {/* Tax Filing Status */}
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">Tax Filing Status</h3>
                        <p className="text-sm text-slate-500 mb-6">Upcoming GSTR-1 Deadline</p>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-[#10a24b] border-t-slate-200 flex items-center justify-center">
                                    <span className="text-xs font-bold">75%</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">GSTR-1 (Current)</p>
                                    <p className="text-xs text-slate-500">Due in 5 days</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full border-4 border-slate-200 flex items-center justify-center">
                                    <span className="text-xs font-bold text-slate-400">0%</span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">GSTR-3B (Current)</p>
                                    <p className="text-xs text-slate-500">Due in 15 days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className="w-full mt-8 py-2.5 bg-[#10a24b] text-white rounded-lg font-bold text-sm hover:bg-[#10a24b]/90 transition-colors">
                        File Taxes Now
                    </button>
                </div>
            </div>

            {/* AI Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-[#10a24b] to-emerald-600 p-6 rounded-xl text-white shadow-lg">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <h4 className="text-sm font-bold">AI Insight</h4>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed">
                        Your GST liability decreased by 5.2% this month. Consider filing GSTR-3B early for potential interest savings.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-amber-500">warning</span>
                        <h4 className="text-sm font-bold text-slate-900">3 Overdue Invoices</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        ₹1,15,000 in outstanding payments. Send reminders to reduce aging receivables.
                    </p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="material-symbols-outlined text-blue-500">trending_up</span>
                        <h4 className="text-sm font-bold text-slate-900">Revenue Trending Up</h4>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Your revenue grew 12.5% compared to last month. Top client: TechNova Solutions.
                    </p>
                </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Recent Invoices</h3>
                    <Link href="/invoices" className="text-sm font-bold text-[#10a24b] hover:underline no-underline">
                        View All
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Invoice ID</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {recent.map(inv => (
                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium">{inv.invoice_number}</td>
                                    <td className="px-6 py-4 text-sm">{inv.customer_name || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-bold">₹{fmt(inv.total_amount)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                inv.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                                            }`}>
                                            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-slate-400 hover:text-[#10a24b] transition-colors">
                                            <span className="material-symbols-outlined">more_horiz</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {recent.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-400 py-10">
                                        {loading ? 'Loading...' : 'No invoices yet. Create your first invoice!'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
