import PublicPageLayout from '@/components/PublicPageLayout';
import Link from 'next/link';

export default function CareersPage() {
    const positions = [
        { title: 'Senior Full-Stack Engineer', team: 'Engineering', location: 'Bangalore / Remote', type: 'Full-time' },
        { title: 'AI/ML Engineer', team: 'AI Research', location: 'Bangalore', type: 'Full-time' },
        { title: 'Product Designer', team: 'Design', location: 'Remote', type: 'Full-time' },
        { title: 'DevOps Engineer', team: 'Infrastructure', location: 'Remote', type: 'Full-time' },
        { title: 'Customer Success Manager', team: 'Growth', location: 'Mumbai / Delhi', type: 'Full-time' },
    ];

    const perks = [
        { icon: '🏠', title: 'Remote-first', desc: 'Work from anywhere in India' },
        { icon: '📈', title: 'Employee Stock Options', desc: 'Own a piece of what you build' },
        { icon: '🏥', title: 'Health Insurance', desc: 'For you and your family' },
        { icon: '📚', title: 'Learning Budget', desc: '₹50,000/year for courses & conferences' },
        { icon: '🏖️', title: 'Flexible PTO', desc: 'Unlimited paid time off' },
        { icon: '💻', title: 'Equipment Stipend', desc: 'MacBook Pro + accessories provided' },
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Careers</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Build the future of GST automation</h1>
                    <p className="text-lg text-slate-500 mt-4">Join our team and help 10 million Indian businesses simplify compliance.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-16">
                    {perks.map(p => (
                        <div key={p.title} className="bg-white p-5 rounded-xl border border-slate-200 text-center">
                            <div className="text-2xl mb-2">{p.icon}</div>
                            <p className="text-sm font-bold text-slate-900">{p.title}</p>
                            <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                        </div>
                    ))}
                </div>

                <h2 className="text-2xl font-bold text-slate-900 mb-8">Open Positions</h2>
                <div className="space-y-4">
                    {positions.map(p => (
                        <div key={p.title} className="bg-white p-6 rounded-xl border border-slate-200 hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">{p.title}</h3>
                                <p className="text-sm text-slate-500 mt-1">{p.team} · {p.location} · {p.type}</p>
                            </div>
                            <Link href="/contact" className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold no-underline transition-colors whitespace-nowrap text-center">Apply Now</Link>
                        </div>
                    ))}
                </div>
            </div>
        </PublicPageLayout>
    );
}
