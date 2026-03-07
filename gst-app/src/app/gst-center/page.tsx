'use client';

import { useState, useEffect } from 'react';
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

interface GstCard {
    cgst_payable: number;
    sgst_payable: number;
    igst_payable: number;
    input_tax_credit: number;
}

export default function GstCenterPage() {
    const [cards, setCards] = useState<GstCard | null>(null);
    const [validateResult, setValidateResult] = useState<any>(null);
    const [gstin, setGstin] = useState('');
    const [loading, setLoading] = useState(true);
    const fmt = formatPaiseClient;

    useEffect(() => {
        apiFetch('/gst/summary-cards')
            .then(data => setCards(data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    const handleValidate = async () => {
        if (!gstin.trim()) return;
        try {
            const token = getToken();
            const res = await fetch(`${API}/gst/validate-gstin?gstin=${gstin}`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            const data = await res.json();
            setValidateResult(data);
        } catch { }
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700 }}>GST Center</h2>
                <p style={{ color: '#64748b', marginTop: '4px' }}>Tax compliance and management dashboard</p>
            </div>

            {/* GST Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div className="stat-icon green">
                            <span className="material-symbols-outlined">paid</span>
                        </div>
                    </div>
                    <p className="stat-label">CGST Payable</p>
                    <p className="stat-value">₹{fmt(cards?.cgst_payable ?? 0)}</p>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div className="stat-icon green">
                            <span className="material-symbols-outlined">paid</span>
                        </div>
                    </div>
                    <p className="stat-label">SGST Payable</p>
                    <p className="stat-value">₹{fmt(cards?.sgst_payable ?? 0)}</p>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div className="stat-icon green">
                            <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                    </div>
                    <p className="stat-label">IGST Payable</p>
                    <p className="stat-value">₹{fmt(cards?.igst_payable ?? 0)}</p>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <div className="stat-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>
                            <span className="material-symbols-outlined">redeem</span>
                        </div>
                    </div>
                    <p className="stat-label">Input Tax Credit</p>
                    <p className="stat-value">₹{fmt(cards?.input_tax_credit ?? 0)}</p>
                </div>
            </div>

            {/* GSTIN Validator + Filing Deadlines */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* GSTIN Validator */}
                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>GSTIN Validator</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Verify any GSTIN number</p>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                        <input
                            className="form-input"
                            placeholder="Enter GSTIN (e.g. 27AAACG1234F1Z5)"
                            value={gstin}
                            onChange={e => setGstin(e.target.value.toUpperCase())}
                            style={{ flex: 1 }}
                        />
                        <button className="btn-primary" onClick={handleValidate}>Validate</button>
                    </div>
                    {validateResult && (
                        <div style={{ padding: '16px', borderRadius: '8px', background: validateResult.valid ? '#f0fdf4' : '#fef2f2' }}>
                            <p style={{ fontWeight: 600, color: validateResult.valid ? '#166534' : '#991b1b' }}>
                                {validateResult.valid ? '✅ Valid GSTIN' : '❌ Invalid GSTIN'}
                            </p>
                            {validateResult.results?.map((r: any, i: number) => (
                                <p key={i} style={{ fontSize: '13px', color: r.passed ? '#16a34a' : '#dc2626', marginTop: '4px' }}>
                                    {r.passed ? '✓' : '✗'} {r.message}
                                </p>
                            ))}
                        </div>
                    )}
                </div>

                {/* Filing Deadlines */}
                <div className="card">
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>Filing Deadlines</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Upcoming GST return dates</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {[
                            { name: 'GSTR-3B', desc: 'Monthly Summary Return', due: '20th of every month', status: 'pending' },
                            { name: 'GSTR-1', desc: 'Outward Supplies', due: '11th of every month', status: 'pending' },
                            { name: 'IFF', desc: 'Invoice Furnishing Facility', due: '13th of every month', status: 'upcoming' },
                        ].map((d, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < 2 ? '1px solid #f1f5f9' : 'none' }}>
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: '14px' }}>{d.name}</p>
                                    <p style={{ color: '#94a3b8', fontSize: '12px' }}>{d.desc}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ fontSize: '13px', fontWeight: 500 }}>{d.due}</p>
                                    <span className={`badge ${d.status === 'pending' ? 'badge-orange' : 'badge-blue'}`}>
                                        {d.status.charAt(0).toUpperCase() + d.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
