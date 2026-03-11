'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatPaiseClient } from '@/lib/api-helpers';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
function getToken() { if (typeof window === 'undefined') return null; return localStorage.getItem('gst_token'); }
async function apiFetch(path: string, opts?: RequestInit) {
    const token = getToken();
    const res = await fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
}

interface LineItem { description: string; qty: number; price: number; gstRate: number; }

export default function CreateInvoicePage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [customer, setCustomer] = useState('');
    const [gstin, setGstin] = useState('27AAACG1234F1Z5');
    const [address, setAddress] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('2024-001');
    const [invoiceDate, setInvoiceDate] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [items, setItems] = useState<LineItem[]>([{ description: '', qty: 1, price: 0, gstRate: 18 }]);
    const [notes, setNotes] = useState('');
    const [terms, setTerms] = useState('1. Please pay within 15 days from the date of invoice.\n2. Make all cheques payable to GSTFlow Fintech Solutions.\n3. Thank you for your business!');

    const fmt = formatPaiseClient;

    const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
        const copy = [...items];
        (copy[idx] as any)[field] = value;
        setItems(copy);
    };

    const addItem = () => setItems([...items, { description: '', qty: 1, price: 0, gstRate: 18 }]);
    const removeItem = (idx: number) => items.length > 1 && setItems(items.filter((_, i) => i !== idx));

    const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);
    const cgst = items.reduce((s, i) => s + (i.qty * i.price * i.gstRate / 200), 0);
    const sgst = cgst;
    const igst = 0;
    const total = subtotal + cgst + sgst + igst;

    const handleSave = async (status: string) => {
        setIsSubmitting(true);
        try {
            const payload = {
                buyer_name: customer || 'Walk-in Customer',
                buyer_gstin: gstin,
                buyer_state_code: '27',
                invoice_date: invoiceDate || new Date().toISOString().split('T')[0],
                due_date: dueDate || new Date().toISOString().split('T')[0],
                status: status,
                notes: notes,
                terms: terms,
                items: items.map(i => ({
                    description: i.description || 'Item',
                    quantity: i.qty,
                    unit_price: Math.round(i.price * 100),
                    gst_rate: i.gstRate,
                    discount: 0
                }))
            };

            await apiFetch('/invoices', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            router.push('/invoices');
        } catch (error: any) {
            alert(error.message || 'Failed to create invoice');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-slate-900">Create New Invoice</h2>
                    <p className="text-xs text-slate-500">Draft saved just now</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50">
                        Save as Draft
                    </button>
                    <button
                        onClick={() => handleSave('sent')}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-white bg-[#10a24b] rounded-lg hover:bg-[#10a24b]/90 shadow-sm shadow-[#10a24b]/20 disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save and Send Invoice'}
                    </button>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-10 max-w-5xl">
                {/* Top — Customer + Invoice Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Customer Details */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Customer Details</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium">Select Customer</label>
                                <select
                                    value={customer}
                                    onChange={e => setCustomer(e.target.value)}
                                    className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b] transition-all"
                                >
                                    <option value="">Select...</option>
                                    <option>Acme Corporation</option>
                                    <option>Globex Inc.</option>
                                    <option>Soylent Corp</option>
                                    <option>+ Add New Customer</option>
                                </select>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium">GSTIN</label>
                                <input readOnly value={gstin} className="w-full rounded-lg border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium">Billing Address</label>
                                <textarea
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b] transition-all"
                                    rows={3}
                                    placeholder="123 Business Park, Sector 45..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Metadata */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Invoice Info</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium">Invoice Number</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">INV-</span>
                                    <input
                                        value={invoiceNumber}
                                        onChange={e => setInvoiceNumber(e.target.value)}
                                        className="w-full pl-12 rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b] transition-all"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium">Invoice Date</label>
                                    <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b]" />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium">Due Date</label>
                                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b]" />
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#10a24b]/5 rounded-lg p-4 border border-[#10a24b]/10">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-semibold text-[#10a24b] uppercase">Total Balance</span>
                                <span className="text-xl font-bold text-slate-900">₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Line Items</h3>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase">
                                <tr>
                                    <th className="px-4 py-3">Description</th>
                                    <th className="px-4 py-3 w-24">Qty</th>
                                    <th className="px-4 py-3 w-32">Price</th>
                                    <th className="px-4 py-3 w-28">GST %</th>
                                    <th className="px-4 py-3 w-32 text-right">Amount</th>
                                    <th className="px-4 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {items.map((item, idx) => (
                                    <tr key={idx}>
                                        <td className="p-4">
                                            <input
                                                value={item.description}
                                                onChange={e => updateItem(idx, 'description', e.target.value)}
                                                className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 placeholder:text-slate-300 outline-none"
                                                placeholder="Product or service name"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <input type="number" value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))} className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none" />
                                        </td>
                                        <td className="p-4">
                                            <input type="number" value={item.price || ''} onChange={e => updateItem(idx, 'price', Number(e.target.value))} className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none" placeholder="0.00" />
                                        </td>
                                        <td className="p-4">
                                            <select value={item.gstRate} onChange={e => updateItem(idx, 'gstRate', Number(e.target.value))} className="w-full border-none bg-transparent p-0 text-sm focus:ring-0 outline-none">
                                                <option value={18}>18%</option>
                                                <option value={12}>12%</option>
                                                <option value={5}>5%</option>
                                                <option value={28}>28%</option>
                                                <option value={0}>0%</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right text-sm font-medium">₹ {(item.qty * item.price * (1 + item.gstRate / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-4">
                                            <button onClick={() => removeItem(idx)} className="text-slate-300 hover:text-red-500 transition-colors">
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="p-3 bg-slate-50/50">
                            <button onClick={addItem} className="flex items-center gap-2 text-[#10a24b] text-sm font-semibold hover:text-[#10a24b]/80 transition-colors">
                                <span className="material-symbols-outlined text-lg">add_circle</span>
                                Add Line Item
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes + Totals */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Notes &amp; Terms</h3>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-500">Internal Notes</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b]" placeholder="Visible only to you..." rows={2} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-slate-500">Terms &amp; Conditions</label>
                                <textarea value={terms} onChange={e => setTerms(e.target.value)} className="w-full rounded-lg border-slate-200 bg-slate-50 text-sm focus:border-[#10a24b] focus:ring-[#10a24b]" rows={4} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-6 space-y-4 h-fit">
                        <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">₹ {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500">CGST (9%)</span><span className="font-medium">₹ {cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm"><span className="text-slate-500">SGST (9%)</span><span className="font-medium">₹ {sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                        <div className="flex justify-between text-sm border-b border-slate-200 pb-4"><span className="text-slate-500">IGST (0%)</span><span className="font-medium">₹ 0.00</span></div>
                        <div className="flex justify-between items-center pt-2">
                            <span className="text-base font-bold">Total Amount</span>
                            <span className="text-2xl font-black text-[#10a24b]">₹ {total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
