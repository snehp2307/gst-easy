import PublicPageLayout from '@/components/PublicPageLayout';
import Link from 'next/link';

export default function CommunityPage() {
    const channels = [
        { icon: 'forum', title: 'Discussion Forum', desc: 'Ask questions, share tips, and connect with other GSTFlow users', action: 'Join Forum', color: 'bg-blue-100 text-blue-600' },
        { icon: 'groups', title: 'WhatsApp Community', desc: 'Get instant help from our community of 5,000+ business owners', action: 'Join WhatsApp', color: 'bg-emerald-100 text-emerald-600' },
        { icon: 'videocam', title: 'Weekly Webinars', desc: 'Live sessions on GST compliance, new features, and best practices', action: 'Register', color: 'bg-violet-100 text-violet-600' },
        { icon: 'code', title: 'GitHub', desc: 'Explore our open-source tools and contribute to the platform', action: 'Visit GitHub', color: 'bg-slate-100 text-slate-600' },
    ];

    const resources = [
        '📄 GST Compliance Checklist (PDF)',
        '📊 GSTR-1 Filing Template',
        '📋 Invoice Best Practices Guide',
        '🎥 GSTFlow Setup Video Tutorial',
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Community</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Join the GSTFlow community</h1>
                    <p className="text-lg text-slate-500 mt-4">Learn, share, and grow with thousands of Indian businesses.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {channels.map(c => (
                        <div key={c.title} className="bg-white p-6 rounded-2xl border border-slate-200 hover:shadow-md transition-shadow">
                            <div className={`w-12 h-12 rounded-xl ${c.color} flex items-center justify-center mb-4`}><span className="material-symbols-outlined text-2xl">{c.icon}</span></div>
                            <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
                            <p className="text-sm text-slate-500 mt-1 mb-4">{c.desc}</p>
                            <button className="text-sm text-[#10a24b] font-bold">{c.action} →</button>
                        </div>
                    ))}
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Free Resources</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {resources.map(r => (
                            <div key={r} className="bg-white p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:border-[#10a24b] transition-colors cursor-pointer">{r}</div>
                        ))}
                    </div>
                </div>
            </div>
        </PublicPageLayout>
    );
}
