'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getGstSummary, listInvoices, getCurrentUser, formatPaiseClient } from '@/lib/api-helpers';
import type { GstSummary, Invoice } from '@/lib/api';

export default function DashboardPage() {
  const [summary, setSummary] = useState<GstSummary | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const currentPeriod = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [gst, invoices] = await Promise.all([
          getGstSummary(currentPeriod).catch(() => null),
          listInvoices({ page_size: 5 }).catch(() => ({ invoices: [], total: 0, page: 1, page_size: 5 })),
        ]);
        setSummary(gst);
        setRecentInvoices(invoices.invoices);
      } catch {
        // Fallback to demo data if backend unavailable
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [currentPeriod]);

  const fmt = formatPaiseClient;
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  // Derive values from API or use defaults
  const salesTotal = summary?.total_taxable_sales ?? 0;
  const purchasesTotal = summary?.total_taxable_purchases ?? 0;
  const outputGst = summary?.output_gst.total ?? 0;
  const itcTotal = summary?.itc.total ?? 0;
  const netPayable = summary?.net_payable.total ?? 0;
  const salesCount = summary?.sales_count ?? 0;
  const purchasesCount = summary?.purchases_count ?? 0;

  return (
    <div className="animate-fadeIn">
      {/* Welcome */}
      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '2px' }}>
          Welcome{user ? `, ${user.name}` : ''} 👋
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {monthName}
        </p>
      </div>

      {/* Deadline Banner */}
      <div className="deadline-banner" style={{ margin: '0 16px 16px' }}>
        ⚠️ GSTR-1 due in 6 days (11 {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })})
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 16px', marginBottom: '12px' }}>
        <div className="card metric-card">
          <div className="metric-label">🧾 SALES</div>
          <div className="metric-value" style={{ color: 'var(--primary)' }}>₹{fmt(salesTotal)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{salesCount} invoices</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">🧾 PURCHASES</div>
          <div className="metric-value" style={{ color: 'var(--secondary)' }}>₹{fmt(purchasesTotal)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{purchasesCount} bills</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">🔴 OUTPUT GST</div>
          <div className="metric-value" style={{ color: 'var(--red)' }}>₹{fmt(outputGst)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CGST + SGST + IGST</div>
        </div>
        <div className="card metric-card">
          <div className="metric-label">🟢 ITC (CREDIT)</div>
          <div className="metric-value" style={{ color: 'var(--green)' }}>₹{fmt(itcTotal)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {itcTotal > 0 && '✅ Eligible'}
          </div>
        </div>
      </div>

      {/* Net GST */}
      <div className="card gst-net-card" style={{ margin: '0 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="metric-label">🔥 NET GST TO PAY</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color: netPayable > 0 ? 'var(--primary)' : 'var(--green)' }}>
              ₹{fmt(Math.max(0, netPayable))}
            </div>
            <Link href="/gst-summary" style={{ fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
              View full GST summary →
            </Link>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className="badge badge-yellow">📝 Draft</span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Due: 20 {new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 16px', marginBottom: '16px' }}>
        <Link href="/invoices/new" className="btn btn-primary btn-lg" style={{ justifyContent: 'center', textDecoration: 'none' }}>
          + Create Invoice
        </Link>
        <Link href="/bills" className="btn btn-ghost btn-lg" style={{ justifyContent: 'center', textDecoration: 'none' }}>
          📷 Upload Bill
        </Link>
      </div>

      {/* Recent Activity */}
      {recentInvoices.length > 0 && (
        <div style={{ padding: '0 16px', paddingBottom: '100px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>
            RECENT ACTIVITY
          </h2>
          <div className="card" style={{ padding: 0 }}>
            {recentInvoices.map(inv => (
              <div key={inv.id} className="invoice-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className={`confidence-dot confidence-${inv.confidence_score}`} />
                    <span className="invoice-party">{inv.party_name || inv.invoice_number}</span>
                  </div>
                  <div className="invoice-meta">
                    {inv.invoice_number} • {new Date(inv.invoice_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
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
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading...
        </div>
      )}
    </div>
  );
}
