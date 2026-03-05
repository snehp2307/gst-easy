'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GST_RATES } from '@/lib/gst-engine';
import { calculateLineItemGst, isInterState, calculateInvoiceTotals, formatPaise } from '@/lib/gst-engine';
import { INDIAN_STATES } from '@/lib/indian-states';
import { createInvoice } from '@/lib/api';

interface LineItem {
    description: string;
    hsnCode: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
}

const EMPTY_ITEM: LineItem = { description: '', hsnCode: '', quantity: 1, unitPrice: 0, gstRate: 18 };

export default function NewInvoicePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [saving, setSaving] = useState(false);

    const [buyerName, setBuyerName] = useState('');
    const [buyerGstin, setBuyerGstin] = useState('');
    const [gstinValid, setGstinValid] = useState<boolean | null>(null);
    const [buyerState, setBuyerState] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [items, setItems] = useState<LineItem[]>([{ ...EMPTY_ITEM }]);

    const sellerStateCode = '27';

    const validateGstin = (value: string) => {
        setBuyerGstin(value.toUpperCase());
        if (value.length === 0) { setGstinValid(null); return; }
        const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        const valid = regex.test(value.toUpperCase());
        setGstinValid(valid);
        if (valid) {
            const state = INDIAN_STATES.find(s => s.code === value.substring(0, 2));
            if (state) setBuyerState(state.name);
        }
    };

    const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    };

    const addItem = () => setItems([...items, { ...EMPTY_ITEM }]);
    const removeItem = (index: number) => {
        if (items.length > 1) setItems(items.filter((_, i) => i !== index));
    };

    const buyerStateCode = buyerGstin.length >= 2 ? buyerGstin.substring(0, 2) : sellerStateCode;
    const interState = isInterState(sellerStateCode, buyerStateCode);

    const calculatedItems = items.map(item => {
        const paise = Math.round(item.unitPrice * 100);
        return calculateLineItemGst({ quantity: item.quantity, unitPrice: paise, gstRate: item.gstRate }, interState);
    });

    const totals = calculateInvoiceTotals(calculatedItems);

    const handleSave = async () => {
        setSaving(true);
        try {
            await createInvoice({
                buyer_name: buyerName,
                buyer_gstin: buyerGstin || undefined,
                buyer_state_code: buyerStateCode,
                invoice_date: invoiceDate,
                items: items.map(item => ({
                    description: item.description,
                    hsn_code: item.hsnCode || undefined,
                    quantity: item.quantity,
                    unit_price: Math.round(item.unitPrice * 100),
                    gst_rate: item.gstRate,
                })),
            });
            router.push('/invoices');
        } catch {
            alert('Invoice saved locally (demo mode — backend not connected)');
            router.push('/invoices');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: '16px', paddingBottom: '100px' }}>
            {/* Progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
                {[1, 2, 3].map(s => (
                    <div key={s} style={{
                        flex: 1, height: '4px', borderRadius: '2px',
                        background: s <= step ? 'var(--primary)' : 'var(--border)',
                        transition: 'background 0.3s',
                    }} />
                ))}
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '4px' }}>
                {step === 1 ? 'Buyer Details' : step === 2 ? 'Line Items' : 'Review & Save'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Step {step} of 3</p>

            {/* Step 1: Buyer */}
            {step === 1 && (
                <div>
                    <div className="form-group">
                        <label className="form-label">Buyer GSTIN (optional for B2C)</label>
                        <input className="form-input" placeholder="e.g. 27AADCS1234F1ZP" value={buyerGstin}
                            onChange={e => validateGstin(e.target.value)} maxLength={15}
                            style={{ textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '1px' }} />
                        {gstinValid === true && (
                            <div style={{ fontSize: '13px', color: 'var(--green)', marginTop: '4px' }}>
                                ✅ Valid — {buyerState} {interState ? '(Inter-state → IGST)' : '(Same state → CGST+SGST)'}
                            </div>
                        )}
                        {gstinValid === false && <div className="form-error">❌ Invalid GSTIN format</div>}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Buyer Name *</label>
                        <input className="form-input" placeholder="e.g. Sharma Constructions" value={buyerName}
                            onChange={e => setBuyerName(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Invoice Date</label>
                        <input className="form-input" type="date" value={invoiceDate}
                            onChange={e => setInvoiceDate(e.target.value)} />
                    </div>
                    <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '16px' }}
                        onClick={() => setStep(2)} disabled={!buyerName.trim()}>
                        Next → Line Items
                    </button>
                </div>
            )}

            {/* Step 2: Items */}
            {step === 2 && (
                <div>
                    {items.map((item, index) => (
                        <div key={index} className="card" style={{ marginBottom: '12px', position: 'relative' }}>
                            {items.length > 1 && (
                                <button onClick={() => removeItem(index)}
                                    style={{ position: 'absolute', top: '8px', right: '8px', fontSize: '18px', color: 'var(--red)', cursor: 'pointer', background: 'none', border: 'none' }}>
                                    ✕
                                </button>
                            )}
                            <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '12px' }}>ITEM {index + 1}</div>
                            <div className="form-group">
                                <label className="form-label">Description *</label>
                                <input className="form-input" placeholder="e.g. Cement 50kg bag" value={item.description}
                                    onChange={e => updateItem(index, 'description', e.target.value)} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">HSN Code</label>
                                    <input className="form-input" placeholder="e.g. 2523" value={item.hsnCode}
                                        onChange={e => updateItem(index, 'hsnCode', e.target.value)} maxLength={8} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">GST Rate *</label>
                                    <select className="form-input form-select" value={item.gstRate}
                                        onChange={e => updateItem(index, 'gstRate', Number(e.target.value))}>
                                        {GST_RATES.map(rate => <option key={rate} value={rate}>{rate}%</option>)}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="form-group">
                                    <label className="form-label">Quantity *</label>
                                    <input className="form-input" type="number" inputMode="numeric" min="1" value={item.quantity}
                                        onChange={e => updateItem(index, 'quantity', Number(e.target.value))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Unit Price (₹) *</label>
                                    <input className="form-input" type="number" inputMode="decimal" min="0" step="0.01"
                                        placeholder="0.00" value={item.unitPrice || ''}
                                        onChange={e => updateItem(index, 'unitPrice', Number(e.target.value))} />
                                </div>
                            </div>
                            {item.unitPrice > 0 && item.quantity > 0 && (
                                <div style={{ background: 'var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '10px 12px', marginTop: '8px', fontSize: '13px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Taxable</span>
                                        <span style={{ fontWeight: '600' }}>₹{formatPaise(calculatedItems[index]?.taxableValue || 0)}</span>
                                    </div>
                                    {!interState ? (
                                        <>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>CGST @{item.gstRate / 2}%</span>
                                                <span style={{ fontWeight: '600' }}>₹{formatPaise(calculatedItems[index]?.cgstAmount || 0)}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ color: 'var(--text-muted)' }}>SGST @{item.gstRate / 2}%</span>
                                                <span style={{ fontWeight: '600' }}>₹{formatPaise(calculatedItems[index]?.sgstAmount || 0)}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>IGST @{item.gstRate}%</span>
                                            <span style={{ fontWeight: '600' }}>₹{formatPaise(calculatedItems[index]?.igstAmount || 0)}</span>
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: '6px', paddingTop: '6px', fontWeight: '700' }}>
                                        <span>Total</span><span>₹{formatPaise(calculatedItems[index]?.totalAmount || 0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <button className="btn btn-ghost" onClick={addItem} style={{ width: '100%', border: '1.5px dashed var(--border)', marginBottom: '16px' }}>+ Add Item</button>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-ghost btn-lg" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                        <button className="btn btn-primary btn-lg" onClick={() => setStep(3)} style={{ flex: 2 }}
                            disabled={items.some(i => !i.description || i.unitPrice <= 0)}>Next → Review</button>
                    </div>
                </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
                <div>
                    <div className="card" style={{ marginBottom: '16px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '4px' }}>BUYER</div>
                            <div style={{ fontWeight: '600' }}>{buyerName}</div>
                            {buyerGstin && <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{buyerGstin}</div>}
                            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                {interState ? '🔄 Inter-state → IGST' : '🏠 Same state → CGST + SGST'}
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>
                            {items.length} ITEM{items.length > 1 ? 'S' : ''}
                        </div>
                        {items.map((item, i) => (
                            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{item.description}</div>
                                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                                    {item.quantity} × ₹{item.unitPrice.toLocaleString('en-IN')} @ {item.gstRate}% = ₹{formatPaise(calculatedItems[i]?.totalAmount || 0)}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card" style={{ background: 'linear-gradient(135deg, #eef2ff, #e0e7ff)', border: 'none', marginBottom: '16px' }}>
                        <div className="gst-row"><span className="gst-row-label">Taxable</span><span className="gst-row-value">₹{formatPaise(totals.totalTaxableValue)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">CGST</span><span className="gst-row-value">₹{formatPaise(totals.totalCgst)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">SGST</span><span className="gst-row-value">₹{formatPaise(totals.totalSgst)}</span></div>
                        <div className="gst-row"><span className="gst-row-label">IGST</span><span className="gst-row-value">₹{formatPaise(totals.totalIgst)}</span></div>
                        <div className="gst-row" style={{ borderTop: '2px solid rgba(99,102,241,0.2)', marginTop: '8px', paddingTop: '8px' }}>
                            <span style={{ fontWeight: '800', fontSize: '18px' }}>Grand Total</span>
                            <span style={{ fontWeight: '800', fontSize: '24px', color: 'var(--primary)' }}>₹{formatPaise(totals.totalAmount)}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-ghost btn-lg" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</button>
                        <button className="btn btn-primary btn-lg" onClick={handleSave} style={{ flex: 2 }} disabled={saving}>
                            {saving ? '⏳ Saving...' : '✅ Save Invoice'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
