import PublicPageLayout from '@/components/PublicPageLayout';
import Link from 'next/link';

export default function PricingPage() {
    const plans = [
        { name: 'Starter', price: '₹749', period: '/month', desc: 'For freelancers and small shops', features: ['50 invoices/month', 'AI Bill Scanner (10 scans)', 'Basic GST reports', 'Email support', '1 user'], cta: 'Start Free Trial', popular: false },
        { name: 'Business', price: '₹2,499', period: '/month', desc: 'For growing businesses', features: ['Unlimited invoices', 'AI Bill Scanner (unlimited)', 'Full GST compliance suite', 'Priority support', 'Up to 5 users', 'AI chat assistant', 'Custom invoice templates'], cta: 'Start Free Trial', popular: true },
        { name: 'Enterprise', price: '₹7,999', period: '/month', desc: 'For large organizations', features: ['Everything in Business', 'Multi-branch support', 'API access', 'Dedicated account manager', 'Unlimited users', 'Custom integrations', 'SLA guarantee', 'On-premise option'], cta: 'Contact Sales', popular: false },
    ];

    return (
        <PublicPageLayout>
            <div className="max-w-7xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Pricing Plans</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Simple, transparent pricing</h1>
                    <p className="text-lg text-slate-500 mt-4">No hidden charges. Start free, upgrade when you grow.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {plans.map(p => (
                        <div key={p.name} className={`bg-white p-8 rounded-2xl border-2 ${p.popular ? 'border-[#10a24b] shadow-xl relative' : 'border-slate-200'}`}>
                            {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#10a24b] text-white text-xs font-bold px-4 py-1 rounded-full">Most Popular</span>}
                            <h3 className="text-xl font-bold text-slate-900">{p.name}</h3>
                            <p className="text-sm text-slate-500 mt-1">{p.desc}</p>
                            <div className="mt-6 mb-8"><span className="text-4xl font-black text-slate-900">{p.price}</span><span className="text-slate-500 text-sm">{p.period}</span></div>
                            <ul className="space-y-3 mb-8">
                                {p.features.map(f => (
                                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600"><span className="material-symbols-outlined text-[#10a24b] text-base">check_circle</span>{f}</li>
                                ))}
                            </ul>
                            <Link href={p.popular ? '/auth/signup' : '/contact'} className={`block text-center py-3 rounded-xl font-bold text-sm no-underline transition-colors ${p.popular ? 'bg-[#10a24b] text-white hover:bg-[#10a24b]/90' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>{p.cta}</Link>
                        </div>
                    ))}
                </div>
            </div>
        </PublicPageLayout>
    );
}
