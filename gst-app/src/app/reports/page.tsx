'use client';

import { useState } from 'react';
import { downloadReport } from '@/lib/api';

export default function ReportsPage() {
    const [downloading, setDownloading] = useState<string | null>(null);

    const handleDownload = async (format: string, filename: string) => {
        setDownloading(filename);
        try {
            const blob = await downloadReport(format.toLowerCase());
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gstflow-${filename.toLowerCase().replace(/\s+/g, '-')}.${format.toLowerCase()}`;
            a.click();
            URL.revokeObjectURL(url);
        } catch {
            alert('Report generation failed. Make sure the backend is running.');
        }
        setDownloading(null);
    };

    const reports = [
        { title: 'Invoice Report', desc: 'Complete CSV export of all invoices with GST breakdowns', icon: 'description', color: 'bg-[#10a24b]/10 text-[#10a24b]', action: 'Download CSV', format: 'CSV' },
        { title: 'GST Summary Report', desc: 'Period-wise GST liability summary with ITC reconciliation', icon: 'account_balance', color: 'bg-blue-100 text-blue-600', action: 'Download JSON', format: 'JSON' },
        { title: 'GSTR-1 Export', desc: 'Outward supplies filing report ready for GST portal upload', icon: 'upload_file', color: 'bg-violet-100 text-violet-600', action: 'Generate GSTR-1', format: 'JSON' },
        { title: 'GSTR-3B Export', desc: 'Monthly summary return for tax payment and ITC claiming', icon: 'summarize', color: 'bg-amber-100 text-amber-600', action: 'Generate GSTR-3B', format: 'JSON' },
        { title: 'PDF Invoice Pack', desc: 'Bulk download all invoices as branded PDF documents', icon: 'picture_as_pdf', color: 'bg-rose-100 text-rose-600', action: 'Generate PDFs', format: 'PDF' },
        { title: 'Expense Report', desc: 'Monthly expense breakdown by vendor and GST category', icon: 'receipt_long', color: 'bg-cyan-100 text-cyan-600', action: 'Download Report', format: 'CSV' },
        { title: 'Payment Ledger', desc: 'Complete payment history with bank reconciliation data', icon: 'payments', color: 'bg-emerald-100 text-emerald-600', action: 'Export Ledger', format: 'CSV' },
        { title: 'Customer Statement', desc: 'Outstanding balances and transaction history per customer', icon: 'group', color: 'bg-orange-100 text-orange-600', action: 'Generate Statement', format: 'PDF' },
        { title: 'AI Analytics Report', desc: 'AI-generated business intelligence with revenue predictions', icon: 'auto_awesome', color: 'bg-fuchsia-100 text-fuchsia-600', action: 'Generate Report', format: 'PDF' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Reports</h2>
                    <p className="text-slate-500 mt-1">Generate and download business reports</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(r => (
                    <div key={r.title} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-2.5 rounded-xl ${r.color}`}><span className="material-symbols-outlined">{r.icon}</span></div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-full">{r.format}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">{r.title}</h3>
                        <p className="text-xs text-slate-500 leading-relaxed mb-5">{r.desc}</p>
                        <button onClick={() => handleDownload(r.format, r.title)} disabled={downloading === r.title} className="w-full py-2.5 bg-slate-50 hover:bg-[#10a24b] hover:text-white text-slate-700 rounded-lg text-sm font-semibold transition-all border border-slate-200 hover:border-[#10a24b] flex items-center justify-center gap-2 disabled:opacity-50">
                            <span className="material-symbols-outlined text-lg">{downloading === r.title ? 'progress_activity' : 'download'}</span>
                            {downloading === r.title ? 'Generating...' : r.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
