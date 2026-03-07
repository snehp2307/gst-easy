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

  return (
    <div className="animate-fadeIn">
      {/* Page Title */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Financial Overview</h2>
        <p style={{ color: '#64748b', marginTop: '4px' }}>
          Dashboard status for {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="stat-icon green">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <span className="stat-badge up">+12.5%</span>
          </div>
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">₹{fmt(summary?.total_revenue ?? 0)}</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="stat-icon slate">
              <span className="material-symbols-outlined">shopping_cart</span>
            </div>
            <span className="stat-badge down">-4.2%</span>
          </div>
          <p className="stat-label">Total Expenses</p>
          <p className="stat-value">₹{fmt(summary?.total_expenses ?? 0)}</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="stat-icon green">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <span className="stat-badge up">+2.1%</span>
          </div>
          <p className="stat-label">GST Payable</p>
          <p className="stat-value">₹{fmt(summary?.gst_payable ?? 0)}</p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="stat-icon orange">
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
            <span className="stat-badge down">-8.4%</span>
          </div>
          <p className="stat-label">Outstanding Payments</p>
          <p className="stat-value">₹{fmt(summary?.outstanding_payments ?? 0)}</p>
        </div>
      </div>

      {/* Chart + Filing Status */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '32px' }}>
        {/* Bar Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Monthly Revenue Overview</h3>
              <p style={{ fontSize: '14px', color: '#64748b' }}>Comparison of last 6 months</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 500, background: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                Last 6 Months
              </button>
            </div>
          </div>
          <div className="bar-chart">
            {chart.map((item, i) => (
              <div key={i} className="bar-col">
                <div className="bar-tooltip">₹{fmt(item.revenue)}</div>
                <div className="bar-fill" style={{ height: `${Math.max(4, (item.revenue / maxRev) * 100)}%` }} />
                <p className="bar-label">{item.month}</p>
              </div>
            ))}
            {chart.length === 0 && (
              <p style={{ color: '#94a3b8', textAlign: 'center', width: '100%', padding: '60px 0' }}>
                No revenue data yet
              </p>
            )}
          </div>
        </div>

        {/* Tax Filing Status */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Tax Filing Status</h3>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>Upcoming Deadlines</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="filing-circle progress">
                  <span>75%</span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>GSTR-1</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Due in 5 days</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div className="filing-circle">
                  <span style={{ color: '#94a3b8' }}>0%</span>
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 600 }}>GSTR-3B</p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>Due in 15 days</p>
                </div>
              </div>
            </div>
          </div>
          <button className="btn-primary" style={{ width: '100%', marginTop: '32px', justifyContent: 'center' }}>
            File Taxes Now
          </button>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>Recent Invoices</h3>
          <Link href="/invoices" style={{ fontSize: '14px', fontWeight: 600, color: '#10a24b', textDecoration: 'none' }}>
            View All
          </Link>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recent.map(inv => (
              <tr key={inv.id}>
                <td style={{ fontWeight: 500 }}>{inv.invoice_number}</td>
                <td>{inv.customer_name || '—'}</td>
                <td style={{ color: '#64748b' }}>
                  {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </td>
                <td style={{ fontWeight: 700 }}>₹{fmt(inv.total_amount)}</td>
                <td>
                  <span className={`badge ${inv.status === 'paid' ? 'badge-green' : inv.status === 'overdue' ? 'badge-red' : 'badge-orange'}`}>
                    {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                  </span>
                </td>
                <td>
                  <button style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </td>
              </tr>
            ))}
            {recent.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                  {loading ? 'Loading...' : 'No invoices yet. Create your first invoice!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <footer style={{ marginTop: '48px', paddingTop: '24px', borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
          © 2024 GSTFlow Automation Platform. All financial data is encrypted and secure.
        </p>
      </footer>
    </div>
  );
}
