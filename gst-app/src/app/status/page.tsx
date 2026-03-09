import PublicPageLayout from '@/components/PublicPageLayout';

export default function StatusPage() {
    const services = [
        { name: 'API Server', status: 'operational', uptime: '99.98%' },
        { name: 'Web Application', status: 'operational', uptime: '99.99%' },
        { name: 'Database (Supabase)', status: 'operational', uptime: '99.95%' },
        { name: 'AI Services (OCR + Chat)', status: 'operational', uptime: '99.90%' },
        { name: 'Document Storage', status: 'operational', uptime: '99.99%' },
        { name: 'Background Workers', status: 'operational', uptime: '99.85%' },
    ];

    const incidents = [
        { date: 'March 8, 2026', title: 'Scheduled Maintenance', desc: 'Database migration completed. No downtime.', status: 'resolved' },
        { date: 'February 25, 2026', title: 'Delayed OCR Processing', desc: 'OCR queue experienced 15-minute delay due to high load. Auto-scaled and resolved.', status: 'resolved' },
        { date: 'February 10, 2026', title: 'API Latency Spike', desc: 'Brief increase in API response time (avg 2.1s → 4.5s) for 8 minutes. Root cause: database connection pool exhaustion.', status: 'resolved' },
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">System Status</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">All systems operational</h1>
                    <p className="text-lg text-slate-500 mt-4">Current service status for GSTFlow platform.</p>
                </div>

                <div className="bg-[#10a24b]/5 border border-[#10a24b]/20 rounded-xl p-4 flex items-center gap-3 mb-10">
                    <div className="w-3 h-3 rounded-full bg-[#10a24b] animate-pulse" />
                    <p className="text-sm font-semibold text-[#10a24b]">All systems are operational</p>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-12">
                    {services.map((s, i) => (
                        <div key={s.name} className={`flex items-center justify-between px-6 py-4 ${i < services.length - 1 ? 'border-b border-slate-100' : ''}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#10a24b]" />
                                <span className="text-sm font-medium text-slate-900">{s.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs text-slate-500">{s.uptime} uptime</span>
                                <span className="text-xs font-bold text-[#10a24b] bg-[#10a24b]/10 px-2 py-0.5 rounded-full uppercase">Operational</span>
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-6">Recent Incidents</h2>
                <div className="space-y-4">
                    {incidents.map(i => (
                        <div key={i.date} className="bg-white p-5 rounded-xl border border-slate-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-bold text-slate-900">{i.title}</h3>
                                <span className="text-xs text-slate-500">{i.date}</span>
                            </div>
                            <p className="text-xs text-slate-600">{i.desc}</p>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase mt-2 inline-block">Resolved</span>
                        </div>
                    ))}
                </div>
            </div>
        </PublicPageLayout>
    );
}
