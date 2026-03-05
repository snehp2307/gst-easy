'use client';

import { useState, useEffect } from 'react';
import { getGstSummary, formatPaiseClient } from '@/lib/api-helpers';
import { getSummaryPdfUrl, getCsvExportUrl, getJsonExportUrl } from '@/lib/api';
import type { GstSummary } from '@/lib/api';

export default function GstSummaryPage() {
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
    const [summary, setSummary] = useState<GstSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showExplainer, setShowExplainer] = useState(false);

    useEffect(() => {
        setLoading(true);
        getGstSummary(period)
            .then(setSummary)
            .catch(() => setSummary(null))
            .finally(() => setLoading(false));
    }, [period]);

    const fmt = formatPaiseClient;
    const monthLabel = new Date(period + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    // Values from API or fallback to 0
    const o = summary?.output_gst ?? { cgst: 0, sgst: 0, igst: 0, total: 0 };
    const i = summary?.itc ?? { cgst: 0, sgst: 0, igst: 0, total: 0 };
    const n = summary?.net_payable ?? { cgst: 0, sgst: 0, igst: 0, total: 0 };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '20px', fontWeight: '800' }}>GST Summary</h1>
                <select
                    className="form-input form-select"
                    value={period}
                    onChange={e => setPeriod(e.target.value)}
                    style={{ width: 'auto', fontSize: '13px' }}
                >
                    {Array.from({ length: 12 }, (_, idx) => {
                        const d = new Date();
                        d.setMonth(d.getMonth() - idx);
                        const val = d.toISOString().slice(0, 7);
                        return <option key={val} value={val}>{d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</option>;
                    })}
                </select>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>Loading...</div>
            ) : (
                <div style={{ padding: '0 16px', paddingBottom: '100px' }}>
                    {/* Card 1: Output GST */}
                    <div className="card gst-card gst-card-red" style={{ marginBottom: '12px' }}>
                        <div className="gst-card-header">
                            <span>🔴 GST COLLECTED (Output GST)</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--red)', margin: '8px 0' }}>
                            ₹{fmt(o.total)}
                        </div>
                        <div className="gst-row"><span className="gst-row-label">CGST</span><span className="gst-row-value">₹{fmt(o.cgst)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">SGST</span><span className="gst-row-value">₹{fmt(o.sgst)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">IGST</span><span className="gst-row-value">₹{fmt(o.igst)}</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                            From {summary?.sales_count ?? 0} invoices
                        </div>
                    </div>

                    {/* Minus */}
                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700', padding: '4px 0', color: 'var(--text-muted)' }}>
                        ➖ minus
                    </div>

                    {/* Card 2: ITC */}
                    <div className="card gst-card gst-card-green" style={{ marginBottom: '12px' }}>
                        <div className="gst-card-header">
                            <span>🟢 GST CREDIT (ITC)</span>
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--green)', margin: '8px 0' }}>
                            ₹{fmt(i.total)}
                        </div>
                        <div className="gst-row"><span className="gst-row-label">CGST</span><span className="gst-row-value">₹{fmt(i.cgst)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">SGST</span><span className="gst-row-value">₹{fmt(i.sgst)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">IGST</span><span className="gst-row-value">₹{fmt(i.igst)}</span></div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '8px' }}>
                            From {summary?.purchases_count ?? 0} purchase bills
                        </div>
                    </div>

                    {/* Equals */}
                    <div style={{ textAlign: 'center', fontSize: '18px', fontWeight: '700', padding: '4px 0', color: 'var(--text-muted)' }}>
                        🟰 equals
                    </div>

                    {/* Card 3: Net Payable */}
                    <div className="card gst-card gst-net-card" style={{ marginBottom: '16px' }}>
                        <div className="gst-card-header">
                            <span>🔥 NET GST PAYABLE</span>
                            <span className="badge badge-yellow">📝 Draft</span>
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: n.total > 0 ? 'var(--primary)' : 'var(--green)', margin: '8px 0' }}>
                            ₹{fmt(Math.max(0, n.total))}
                        </div>
                        {n.total <= 0 && summary?.itc_carryforward && summary.itc_carryforward > 0 && (
                            <div style={{ fontSize: '13px', color: 'var(--green)', marginBottom: '8px' }}>
                                ✅ ITC excess! ₹{fmt(summary.itc_carryforward)} carries to next month
                            </div>
                        )}
                        <div className="gst-row"><span className="gst-row-label">CGST payable</span><span className="gst-row-value">₹{fmt(Math.max(0, n.cgst))}</span></div>
                        <div className="gst-row"><span className="gst-row-label">SGST payable</span><span className="gst-row-value">₹{fmt(Math.max(0, n.sgst))}</span></div>
                        <div className="gst-row"><span className="gst-row-label">IGST payable</span><span className="gst-row-value">₹{fmt(Math.max(0, n.igst))}</span></div>

                        <button className="btn btn-ghost" onClick={() => setShowExplainer(true)} style={{ width: '100%', marginTop: '12px' }}>
                            🤔 Why this amount?
                        </button>
                    </div>

                    {/* Export Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <a href={getSummaryPdfUrl(period)} className="btn btn-primary btn-sm" style={{ textDecoration: 'none' }}>
                            📄 PDF Report
                        </a>
                        <a href={getCsvExportUrl(period)} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                            📊 CSV Export
                        </a>
                        <a href={getJsonExportUrl(period)} className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
                            📋 GSTR-3B Draft
                        </a>
                    </div>
                </div>
            )}

            {/* Explainer Modal */}
            {showExplainer && summary?.explanation && (
                <div className="modal-overlay" onClick={() => setShowExplainer(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">🤔 Why ₹{fmt(Math.max(0, n.total))}?</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {summary.explanation.map((line, idx) => (
                                <p key={idx} style={{ fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{line}</p>
                            ))}
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowExplainer(false)} style={{ width: '100%', marginTop: '16px' }}>
                            Got it ✅
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
