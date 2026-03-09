'use client';

import { useState, useEffect } from 'react';
import { getGstSummary, validateGstin, getTaxFilingStatus, downloadReport, type GstSummary } from '@/lib/api';
import { formatPaiseClient } from '@/lib/api-helpers';

export default function GSTCenterPage() {
    const [gstinInput, setGstinInput] = useState('');
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ valid: boolean; message?: string } | null>(null);
    const [summary, setSummary] = useState<GstSummary | null>(null);
    const [deadlines, setDeadlines] = useState<Record<string, unknown>[]>([]);
    const [loading, setLoading] = useState(true);
    const fmt = formatPaiseClient;

    useEffect(() => {
        Promise.all([
            getGstSummary().then(setSummary).catch(() => { }),
            getTaxFilingStatus().then((d: Record<string, unknown>) => {
                setDeadlines((d.deadlines || []) as Record<string, unknown>[]);
            }).catch(() => { }),
        ]).finally(() => setLoading(false));
    }, []);

    const handleValidate = async () => {
        if (!gstinInput || gstinInput.length < 15) return;
        setValidating(true);
        setValidationResult(null);
        try {
            const res = await validateGstin(gstinInput);
            setValidationResult({ valid: res.valid, message: res.valid ? 'Valid GSTIN' : 'Invalid GSTIN' });
        } catch {
            // Basic client-side validation
            const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            const valid = gstinRegex.test(gstinInput);
            setValidationResult({ valid, message: valid ? 'GSTIN format is valid' : 'Invalid GSTIN format' });
        }
        setValidating(false);
    };

    const handleExportPdf = async () => {
        try {
            const blob = await downloadReport('pdf');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'gst-report.pdf'; a.click();
            URL.revokeObjectURL(url);
        } catch { alert('Export failed. Try again.'); }
    };

    const cgst = summary?.output_gst?.cgst || 0;
    const sgst = summary?.output_gst?.sgst || 0;
    const igst = summary?.output_gst?.igst || 0;
    const itc = (summary?.itc?.cgst || 0) + (summary?.itc?.sgst || 0) + (summary?.itc?.igst || 0);

    const stats = [
        { label: 'CGST Payable', value: loading ? '...' : `₹${fmt(cgst)}`, icon: 'account_balance', iconBg: 'text-[#10a24b] bg-[#10a24b]/10' },
        { label: 'SGST Payable', value: loading ? '...' : `₹${fmt(sgst)}`, icon: 'home_work', iconBg: 'text-[#10a24b] bg-[#10a24b]/10' },
        { label: 'IGST Payable', value: loading ? '...' : `₹${fmt(igst)}`, icon: 'public', iconBg: 'text-blue-500 bg-blue-500/10' },
        { label: 'Input Tax Credit', value: loading ? '...' : `₹${fmt(itc)}`, icon: 'savings', iconBg: 'text-amber-500 bg-amber-500/10', ring: true },
    ];

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Tax Compliance Dashboard</h2>
                    <span className="bg-[#10a24b]/10 text-[#10a24b] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Live Compliance</span>
                </div>
                <p className="text-slate-500 mt-1">Monitor your GST liabilities and input tax credits in real-time.</p>
            </div>

            {/* GST Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map(s => (
                    <div key={s.label} className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm ${s.ring ? 'ring-2 ring-[#10a24b]/20' : ''}`}>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium text-slate-500">{s.label}</p>
                            <span className={`material-symbols-outlined ${s.iconBg} p-1.5 rounded-lg text-lg`}>{s.icon}</span>
                        </div>
                        <h4 className="text-3xl font-bold text-slate-900">{s.value}</h4>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tax Breakdown Table */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h5 className="text-lg font-bold text-slate-900">GST Summary</h5>
                            <button onClick={handleExportPdf} className="text-[#10a24b] text-sm font-bold flex items-center gap-1 hover:underline">
                                <span className="material-symbols-outlined text-lg">download</span> Export PDF
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-emerald-50 rounded-lg"><p className="text-xs text-slate-500">Output CGST</p><p className="text-xl font-bold text-slate-900">₹{fmt(cgst)}</p></div>
                                <div className="p-4 bg-emerald-50 rounded-lg"><p className="text-xs text-slate-500">Output SGST</p><p className="text-xl font-bold text-slate-900">₹{fmt(sgst)}</p></div>
                                <div className="p-4 bg-blue-50 rounded-lg"><p className="text-xs text-slate-500">Output IGST</p><p className="text-xl font-bold text-slate-900">₹{fmt(igst)}</p></div>
                                <div className="p-4 bg-amber-50 rounded-lg"><p className="text-xs text-slate-500">Total ITC</p><p className="text-xl font-bold text-slate-900">₹{fmt(itc)}</p></div>
                                <div className="p-4 bg-[#10a24b]/5 border-2 border-[#10a24b]/20 rounded-lg col-span-2"><p className="text-xs text-slate-500">Net GST Payable</p><p className="text-2xl font-black text-[#10a24b]">₹{fmt(Math.max(0, cgst + sgst + igst - itc))}</p></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    {/* GSTIN Validator */}
                    <div className="bg-[#10a24b] p-6 rounded-xl text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="material-symbols-outlined text-2xl">verified_user</span>
                                <h5 className="text-lg font-bold">GSTIN Validator</h5>
                            </div>
                            <p className="text-white/80 text-sm mb-6 leading-relaxed">Quickly verify the authenticity of any GST identification number.</p>
                            <div className="space-y-3">
                                <input value={gstinInput} onChange={e => setGstinInput(e.target.value.toUpperCase())} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:ring-2 focus:ring-white/30 text-sm focus:outline-none backdrop-blur-sm" placeholder="Enter GSTIN (e.g. 07AABCM...)" />
                                <button onClick={handleValidate} disabled={validating || gstinInput.length < 15} className="w-full bg-white text-[#10a24b] font-bold py-3 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50">
                                    {validating ? 'Validating...' : 'Validate Now'}
                                </button>
                            </div>
                            {validationResult && (
                                <div className={`mt-4 p-3 rounded-lg text-sm font-bold ${validationResult.valid ? 'bg-white/20 text-white' : 'bg-red-500/30 text-white'}`}>
                                    {validationResult.valid ? '✓' : '✗'} {validationResult.message}
                                </div>
                            )}
                        </div>
                        <div className="absolute -right-8 -bottom-8 bg-white/5 w-32 h-32 rounded-full" />
                    </div>

                    {/* Filing Deadlines */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <h5 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#10a24b]">event</span> Filing Deadlines
                        </h5>
                        <div className="space-y-4">
                            {deadlines.length > 0 ? deadlines.map((d, i) => (
                                <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                    <div className="text-center w-10">
                                        <p className="text-lg font-black text-slate-700 leading-none">{String(d.day || '')}</p>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-900">{String(d.title || d.return_type || '')}</p>
                                        <p className="text-[10px] text-slate-500">{String(d.period || d.sub || '')}</p>
                                    </div>
                                    <span className={`material-symbols-outlined ${String(d.status) === 'filed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                        {String(d.status) === 'filed' ? 'check_circle' : 'warning'}
                                    </span>
                                </div>
                            )) : (
                                <div className="space-y-3">
                                    {[{ m: 'Apr', d: '11', t: 'GSTR-1 Filing', s: 'Outward Supplies' }, { m: 'Apr', d: '20', t: 'GSTR-3B Filing', s: 'Monthly Summary' }, { m: 'May', d: '13', t: 'IFF Filing', s: 'Quarterly QRMP' }].map((dl, i) => (
                                        <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
                                            <div className="text-center"><p className="text-[10px] font-bold text-slate-400 uppercase">{dl.m}</p><p className="text-lg font-black text-slate-700 leading-none">{dl.d}</p></div>
                                            <div className="flex-1"><p className="text-xs font-bold text-slate-900">{dl.t}</p><p className="text-[10px] text-slate-500">{dl.s}</p></div>
                                            <span className="material-symbols-outlined text-amber-500">warning</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
