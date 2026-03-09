'use client';

import { motion } from 'framer-motion';
import { ScanLine, FileText, Calculator, Package, Brain, CreditCard } from 'lucide-react';

const FEATURES = [
    {
        icon: ScanLine,
        title: 'AI Bill Scanner',
        description: 'Upload bills and let AI extract vendor details, amounts, and GST data automatically.',
        color: 'bg-violet-100 text-violet-600',
    },
    {
        icon: FileText,
        title: 'Smart Invoice Creation',
        description: 'Generate GST-compliant invoices with automatic CGST, SGST, and IGST calculation.',
        color: 'bg-[#10a24b]/10 text-[#10a24b]',
    },
    {
        icon: Calculator,
        title: 'GST Automation',
        description: 'Automate GSTR-1, GSTR-3B filings. Track ITC, validate GSTINs, and stay compliant.',
        color: 'bg-blue-100 text-blue-600',
    },
    {
        icon: Package,
        title: 'Inventory Management',
        description: 'Track products, HSN codes, stock levels, and get AI-powered reorder predictions.',
        color: 'bg-amber-100 text-amber-600',
    },
    {
        icon: Brain,
        title: 'AI Insights',
        description: 'Get real-time intelligence on expenses, revenue trends, and GST compliance risks.',
        color: 'bg-rose-100 text-rose-600',
    },
    {
        icon: CreditCard,
        title: 'Payment Tracking',
        description: 'Monitor outstanding payments, send reminders, and reconcile transactions.',
        color: 'bg-cyan-100 text-cyan-600',
    },
];

const containerVariants = {
    hidden: {},
    visible: {
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
    return (
        <section id="features" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10a24b]/10 text-[#10a24b] text-xs font-semibold mb-4 border border-[#10a24b]/20">
                        <span className="material-symbols-outlined text-sm">auto_awesome</span>
                        Powerful Features
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Everything you need to manage GST
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        From invoicing to compliance, GSTFlow automates the entire GST workflow for your business.
                    </p>
                </motion.div>

                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                    className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {FEATURES.map((feature) => (
                        <motion.div
                            key={feature.title}
                            variants={itemVariants}
                            className="group relative p-7 rounded-2xl border border-slate-100 hover:border-[#10a24b]/20 bg-white hover:bg-[#10a24b]/[0.02] transition-all duration-300 hover:shadow-lg hover:shadow-[#10a24b]/5 hover:-translate-y-1"
                        >
                            <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                                <feature.icon size={22} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {feature.description}
                            </p>
                            <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-[#10a24b]/0 via-[#10a24b]/40 to-[#10a24b]/0 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-full" />
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
