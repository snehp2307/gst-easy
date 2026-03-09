'use client';

import { motion } from 'framer-motion';

const STEPS = [
    {
        step: '01',
        icon: 'description',
        title: 'Create invoices or scan bills',
        description: 'Generate GST-compliant invoices instantly, or upload bill images for AI-powered data extraction.',
        color: 'from-[#10a24b] to-emerald-600',
    },
    {
        step: '02',
        icon: 'auto_awesome',
        title: 'AI extracts data and calculates GST',
        description: 'Our AI engine reads invoices, identifies line items, and auto-calculates CGST, SGST, and IGST.',
        color: 'from-blue-500 to-indigo-600',
    },
    {
        step: '03',
        icon: 'bar_chart',
        title: 'Track performance and file GST returns',
        description: 'Monitor revenue, expenses, and GST liability. Generate GSTR-1 and GSTR-3B reports in one click.',
        color: 'from-violet-500 to-purple-600',
    },
];

export default function HowItWorks() {
    return (
        <section id="how-it-works" className="py-24 bg-[#f6f8f7] relative">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold mb-4 border border-blue-100">
                        <span className="material-symbols-outlined text-sm">route</span>
                        Simple 3-Step Process
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        How GSTFlow works
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        Get started in minutes. No complex setup, no steep learning curve.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Connecting line */}
                    <div className="hidden md:block absolute top-24 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-[#10a24b]/20 via-blue-200/40 to-violet-200/40" />

                    {STEPS.map((step, i) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.15, duration: 0.5 }}
                            className="relative text-center"
                        >
                            <div className="relative inline-flex mb-6">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                                    <span className="material-symbols-outlined text-white text-2xl">{step.icon}</span>
                                </div>
                                <span className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full text-xs font-bold text-slate-700 flex items-center justify-center shadow-md border border-slate-100">
                                    {step.step}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                            <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
