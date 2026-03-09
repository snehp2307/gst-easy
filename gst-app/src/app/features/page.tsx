import PublicPageLayout from '@/components/PublicPageLayout';
import Link from 'next/link';

export default function FeaturesPage() {
    const features = [
        { icon: 'document_scanner', title: 'AI Bill Scanner', desc: 'Upload any bill — our AI extracts vendor details, amounts, HSN codes, and GST data automatically with 95%+ accuracy.', color: 'bg-violet-100 text-violet-600' },
        { icon: 'receipt_long', title: 'Smart Invoicing', desc: 'Create professional GST-compliant invoices in seconds. Auto-calculate CGST, SGST and IGST based on state codes.', color: 'bg-[#10a24b]/10 text-[#10a24b]' },
        { icon: 'account_balance', title: 'GST Compliance Center', desc: 'Real-time GST liability tracking, GSTR-1/3B filing data, GSTIN validation, and ITC reconciliation — all in one place.', color: 'bg-blue-100 text-blue-600' },
        { icon: 'inventory_2', title: 'Inventory Management', desc: 'Track products with HSN codes, GST rates, and stock levels. Get AI alerts before stock runs out.', color: 'bg-amber-100 text-amber-600' },
        { icon: 'auto_awesome', title: 'AI Business Insights', desc: 'Chat with our AI to query your finances. Revenue predictions, compliance alerts, and optimization recommendations.', color: 'bg-fuchsia-100 text-fuchsia-600' },
        { icon: 'payments', title: 'Payment Tracking', desc: 'Record UPI, bank transfers, cash, and cheque payments. Track outstanding balances and get payment reminders.', color: 'bg-emerald-100 text-emerald-600' },
        { icon: 'cloud_upload', title: 'Document Management', desc: 'Upload invoices, bills, and receipts. OCR processing extracts data and links documents to transactions.', color: 'bg-cyan-100 text-cyan-600' },
        { icon: 'analytics', title: 'Reports & Exports', desc: 'Generate GSTR-1, GSTR-3B, CSV exports, PDF invoices, and AI analytics reports with one click.', color: 'bg-rose-100 text-rose-600' },
        { icon: 'group', title: 'Customer & Vendor Management', desc: 'Maintain GSTIN-verified contacts. Track transaction history and outstanding balances per party.', color: 'bg-orange-100 text-orange-600' },
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Platform Features</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Everything you need for GST compliance</h1>
                    <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">From invoice creation to GST filing — GSTFlow automates every step of your tax workflow.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map(f => (
                        <div key={f.title} className="bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow">
                            <div className={`w-14 h-14 rounded-xl ${f.color} flex items-center justify-center mb-5`}>
                                <span className="material-symbols-outlined text-2xl">{f.icon}</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">{f.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="text-center mt-16">
                    <Link href="/auth/signup" className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-8 py-3.5 rounded-xl text-base font-bold no-underline transition-colors inline-block">Start Free Trial</Link>
                </div>
            </div>
        </PublicPageLayout>
    );
}
