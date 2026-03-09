'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Link from 'next/link';

const PLANS = [
    {
        name: 'Starter',
        price: '₹749',
        period: '/month',
        description: 'Perfect for freelancers and small businesses',
        features: [
            'Up to 50 invoices/month',
            'AI bill scanner (20 scans)',
            'Basic GST reports',
            'Email support',
            '1 user',
        ],
        cta: 'Start Free Trial',
        popular: false,
    },
    {
        name: 'Business',
        price: '₹2,499',
        period: '/month',
        description: 'Best for growing businesses and teams',
        features: [
            'Unlimited invoices',
            'AI bill scanner (unlimited)',
            'Advanced GST analytics',
            'Priority support',
            'Up to 5 users',
            'Inventory management',
            'AI insights & predictions',
        ],
        cta: 'Start Free Trial',
        popular: true,
    },
    {
        name: 'Enterprise',
        price: '₹7,999',
        period: '/month',
        description: 'For large organizations with complex needs',
        features: [
            'Everything in Business',
            'Unlimited users',
            'Custom API access',
            'Dedicated account manager',
            'Multi-branch support',
            'SOC 2 compliance report',
            'SLA guarantee',
            'Custom integrations',
        ],
        cta: 'Contact Sales',
        popular: false,
    },
];

export default function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-[#f6f8f7] relative">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-xs font-semibold mb-4 border border-amber-100">
                        <span className="material-symbols-outlined text-sm">sell</span>
                        Simple Pricing
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Plans for every business size
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Start free for 14 days. No credit card required. Cancel anytime.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {PLANS.map((plan, i) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.12, duration: 0.5 }}
                            className={`
                relative rounded-2xl p-8 flex flex-col
                ${plan.popular
                                    ? 'bg-white border-2 border-[#10a24b] shadow-xl shadow-[#10a24b]/10 scale-105'
                                    : 'bg-white border border-slate-200 shadow-sm'
                                }
              `}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#10a24b] text-white text-xs font-bold px-4 py-1 rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                            <div className="mt-3 mb-1">
                                <span className="text-4xl font-extrabold text-slate-900">{plan.price}</span>
                                <span className="text-slate-500 text-sm">{plan.period}</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-6">{plan.description}</p>

                            <ul className="space-y-3 flex-1 mb-8">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                                        <Check size={16} className="text-[#10a24b] mt-0.5 flex-shrink-0" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <Link
                                href="/auth/signup"
                                className={`
                  block text-center py-3 rounded-xl font-semibold text-sm transition-all no-underline
                  ${plan.popular
                                        ? 'bg-[#10a24b] text-white hover:bg-[#0d8a3e] shadow-sm shadow-[#10a24b]/20'
                                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    }
                `}
                            >
                                {plan.cta}
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
