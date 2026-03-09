import PublicPageLayout from '@/components/PublicPageLayout';

export default function AboutPage() {
    const team = [
        { name: 'Sneha Patel', role: 'Founder & CEO', avatar: 'SP' },
        { name: 'Arjun Mehta', role: 'CTO', avatar: 'AM' },
        { name: 'Priya Sharma', role: 'Head of AI', avatar: 'PS' },
        { name: 'Ravi Kumar', role: 'Lead Engineer', avatar: 'RK' },
    ];

    const stats = [
        { value: '10,000+', label: 'Businesses' },
        { value: '₹500 Cr+', label: 'Invoices processed' },
        { value: '99.9%', label: 'Uptime' },
        { value: '4.8/5', label: 'Customer rating' },
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">About Us</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Making GST compliance effortless</h1>
                    <p className="text-lg text-slate-500 mt-4 max-w-3xl mx-auto">GSTFlow was born from the frustration of manual GST filing. We&apos;re building AI-powered tools that save Indian businesses thousands of hours every year.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
                    {stats.map(s => (
                        <div key={s.label} className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                            <p className="text-3xl font-black text-[#10a24b]">{s.value}</p>
                            <p className="text-sm text-slate-500 mt-2">{s.label}</p>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">Our Team</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
                    {team.map(t => (
                        <div key={t.name} className="text-center">
                            <div className="w-20 h-20 mx-auto rounded-full bg-[#10a24b] text-white flex items-center justify-center text-xl font-bold mb-3">{t.avatar}</div>
                            <p className="text-sm font-bold text-slate-900">{t.name}</p>
                            <p className="text-xs text-slate-500">{t.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </PublicPageLayout>
    );
}
