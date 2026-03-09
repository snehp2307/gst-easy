'use client';

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const BENEFITS = [
    {
        title: 'Eliminate manual bookkeeping',
        description: 'Auto-extract data from bills and generate invoices. Spend 80% less time on data entry.',
    },
    {
        title: 'Avoid costly GST mistakes',
        description: 'AI validates GSTIN numbers, checks HSN codes, and flags compliance errors before filing.',
    },
    {
        title: 'Real-time financial intelligence',
        description: 'Dashboard analytics show revenue trends, expense patterns, and cash flow predictions.',
    },
    {
        title: 'Never miss a filing deadline',
        description: 'Automated reminders for GSTR-1, GSTR-3B, and other compliance deadlines.',
    },
    {
        title: 'Secure & compliant infrastructure',
        description: 'Bank-grade encryption, SOC 2 compliance, and regular security audits.',
    },
    {
        title: 'Scale as you grow',
        description: 'From sole proprietors to large enterprises — GSTFlow scales with your business needs.',
    },
];

export default function BenefitsSection() {
    return (
        <section className="py-24 bg-white relative overflow-hidden">
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#10a24b]/5 rounded-full blur-3xl -translate-y-1/2" />

            <div className="max-w-7xl mx-auto px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true, margin: '-80px' }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold mb-4 border border-emerald-100">
                            <span className="material-symbols-outlined text-sm">rocket_launch</span>
                            Why GSTFlow
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                            Focus on your business,{' '}
                            <span className="text-[#10a24b]">not paperwork</span>
                        </h2>
                        <p className="text-lg text-slate-500 leading-relaxed">
                            Indian businesses lose thousands of hours annually on GST compliance. GSTFlow uses AI to turn hours of work into minutes.
                        </p>
                    </motion.div>

                    {/* Right — Benefits Grid */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, margin: '-60px' }}
                        transition={{ duration: 0.5 }}
                        className="grid sm:grid-cols-2 gap-5"
                    >
                        {BENEFITS.map((benefit, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.08 }}
                                className="flex gap-3"
                            >
                                <CheckCircle2 className="w-5 h-5 text-[#10a24b] flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 mb-1">{benefit.title}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">{benefit.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
