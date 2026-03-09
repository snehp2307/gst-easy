'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-gradient-to-b from-white via-[#f0faf3] to-[#f6f8f7]">
            {/* Background Decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-[#10a24b]/5 blur-3xl" />
                <div className="absolute -bottom-20 -left-40 w-[400px] h-[400px] rounded-full bg-[#10a24b]/5 blur-3xl" />
                <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded-full bg-[#10a24b]/30 animate-pulse" />
                <div className="absolute top-1/2 right-1/3 w-3 h-3 rounded-full bg-[#10a24b]/20 animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute bottom-1/4 left-1/3 w-2 h-2 rounded-full bg-[#10a24b]/25 animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="max-w-7xl mx-auto px-6 py-20 w-full">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#10a24b]/10 text-[#10a24b] text-xs font-semibold mb-6 border border-[#10a24b]/20"
                        >
                            <Sparkles size={14} />
                            AI-Powered GST Platform for India
                        </motion.div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
                            AI-powered GST{' '}
                            <span className="text-[#10a24b] relative">
                                automation
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                                    <path d="M2 8c40-6 80-6 196 0" stroke="#10a24b" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                                </svg>
                            </span>{' '}
                            for Indian businesses
                        </h1>

                        <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
                            Create invoices, scan bills, manage GST, and track payments using intelligent automation. Built for modern Indian businesses.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/auth/signup"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#10a24b] hover:bg-[#0d8a3e] text-white font-semibold rounded-xl transition-all no-underline shadow-lg shadow-[#10a24b]/25 hover:shadow-xl hover:shadow-[#10a24b]/30 hover:-translate-y-0.5"
                            >
                                Get Started Free
                                <ArrowRight size={18} />
                            </Link>
                            <Link
                                href="/auth/login"
                                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-slate-700 font-semibold rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all no-underline hover:-translate-y-0.5"
                            >
                                Login
                            </Link>
                        </div>

                        <div className="mt-10 flex items-center gap-6 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#10a24b] text-lg">check_circle</span>
                                Free 14-day trial
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#10a24b] text-lg">check_circle</span>
                                No credit card
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#10a24b] text-lg">check_circle</span>
                                GST compliant
                            </div>
                        </div>
                    </motion.div>

                    {/* Right — Dashboard Preview */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                        className="relative hidden lg:block"
                    >
                        <div className="relative">
                            {/* Glow behind */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#10a24b]/20 to-emerald-200/20 rounded-2xl blur-2xl scale-105" />

                            {/* Dashboard Mock */}
                            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200/60 overflow-hidden">
                                {/* Title Bar */}
                                <div className="h-10 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-400" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                                    <div className="w-3 h-3 rounded-full bg-green-400" />
                                    <span className="ml-3 text-xs text-slate-400 font-medium">GSTFlow Dashboard</span>
                                </div>

                                {/* Dashboard Content */}
                                <div className="p-6 space-y-5">
                                    {/* Stats Row */}
                                    <div className="grid grid-cols-4 gap-3">
                                        {[
                                            { label: 'Revenue', value: '₹12,40,000', color: 'bg-[#10a24b]/10', icon: 'trending_up', badge: '+12.5%', bColor: 'bg-green-100 text-green-700' },
                                            { label: 'Expenses', value: '₹8,20,000', color: 'bg-slate-100', icon: 'shopping_cart', badge: '-4.2%', bColor: 'bg-red-100 text-red-700' },
                                            { label: 'GST', value: '₹45,200', color: 'bg-[#10a24b]/10', icon: 'account_balance', badge: '+2.1%', bColor: 'bg-green-100 text-green-700' },
                                            { label: 'Outstanding', value: '₹1,15,000', color: 'bg-orange-100', icon: 'pending_actions', badge: '-8.4%', bColor: 'bg-red-100 text-red-700' },
                                        ].map((s, i) => (
                                            <motion.div
                                                key={i}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.6 + i * 0.1 }}
                                                className="p-3 rounded-xl border border-slate-100"
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className={`w-7 h-7 ${s.color} rounded-md flex items-center justify-center`}>
                                                        <span className="material-symbols-outlined text-sm">{s.icon}</span>
                                                    </div>
                                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${s.bColor}`}>{s.badge}</span>
                                                </div>
                                                <p className="text-[10px] text-slate-500">{s.label}</p>
                                                <p className="text-xs font-bold text-slate-900">{s.value}</p>
                                            </motion.div>
                                        ))}
                                    </div>

                                    {/* Chart Mock */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 }}
                                        className="rounded-xl border border-slate-100 p-4"
                                    >
                                        <p className="text-xs font-bold text-slate-700 mb-3">Monthly Revenue</p>
                                        <div className="flex items-end gap-2 h-20">
                                            {[60, 45, 85, 75, 95, 70].map((h, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ height: 0 }}
                                                    animate={{ height: `${h}%` }}
                                                    transition={{ delay: 1.2 + i * 0.1, duration: 0.5 }}
                                                    className="flex-1 bg-[#10a24b]/20 hover:bg-[#10a24b]/30 rounded-t transition-colors"
                                                />
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Table Mock */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1.5 }}
                                        className="rounded-xl border border-slate-100 overflow-hidden"
                                    >
                                        <div className="bg-slate-50 px-4 py-2 text-[10px] font-bold text-slate-500 grid grid-cols-4">
                                            <span>Invoice</span><span>Customer</span><span>Amount</span><span>Status</span>
                                        </div>
                                        {[
                                            { inv: 'INV-001', cust: 'TechNova', amt: '₹45,000', status: 'Paid', sc: 'bg-green-100 text-green-700' },
                                            { inv: 'INV-002', cust: 'Zenith', amt: '₹28,500', status: 'Pending', sc: 'bg-orange-100 text-orange-700' },
                                        ].map((r, i) => (
                                            <div key={i} className="px-4 py-2 text-[10px] grid grid-cols-4 border-t border-slate-50">
                                                <span className="font-medium text-[#10a24b]">{r.inv}</span>
                                                <span className="text-slate-600">{r.cust}</span>
                                                <span className="font-semibold">{r.amt}</span>
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full w-fit ${r.sc}`}>{r.status}</span>
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        {/* Floating badges */}
                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.8, type: 'spring' }}
                            className="absolute -right-4 top-20 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3"
                        >
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-green-600 text-lg">auto_awesome</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">AI Scanned</p>
                                <p className="text-[10px] text-slate-500">3 bills processed</p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 2, type: 'spring' }}
                            className="absolute -left-4 bottom-16 bg-white rounded-xl shadow-lg border border-slate-100 px-4 py-3 flex items-center gap-3"
                        >
                            <div className="w-8 h-8 bg-[#10a24b]/10 rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#10a24b] text-lg">verified</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-800">GST Filed</p>
                                <p className="text-[10px] text-slate-500">GSTR-1 complete</p>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
