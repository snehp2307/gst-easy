import PublicPageLayout from '@/components/PublicPageLayout';

export default function IntegrationsPage() {
    const integrations = [
        { name: 'Tally ERP', desc: 'Two-way sync with Tally for seamless accounting', icon: '📊', status: 'Available' },
        { name: 'Zoho Books', desc: 'Import/export invoices and contacts', icon: '📘', status: 'Available' },
        { name: 'Razorpay', desc: 'Auto-record online payments', icon: '💳', status: 'Coming Soon' },
        { name: 'WhatsApp Business', desc: 'Send invoice PDFs directly via WhatsApp', icon: '💬', status: 'Coming Soon' },
        { name: 'Google Sheets', desc: 'Export reports to Google Sheets automatically', icon: '📑', status: 'Available' },
        { name: 'Slack', desc: 'Get GST filing reminders and alerts', icon: '🔔', status: 'Coming Soon' },
        { name: 'Stripe', desc: 'Payment reconciliation for global transactions', icon: '🌐', status: 'Beta' },
        { name: 'QuickBooks', desc: 'Bi-directional sync with QuickBooks Online', icon: '📒', status: 'Coming Soon' },
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Integrations</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Connect with your favorite tools</h1>
                    <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto">GSTFlow integrates with popular accounting, payment, and productivity tools.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {integrations.map(i => (
                        <div key={i.name} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow text-center">
                            <div className="text-4xl mb-4">{i.icon}</div>
                            <h3 className="text-base font-bold text-slate-900">{i.name}</h3>
                            <p className="text-xs text-slate-500 mt-1 mb-4">{i.desc}</p>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${i.status === 'Available' ? 'bg-emerald-100 text-emerald-700' : i.status === 'Beta' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>{i.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        </PublicPageLayout>
    );
}
