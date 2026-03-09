'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Testimonials', href: '#testimonials' },
];

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <motion.header
            initial={{ y: -80 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
                    ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm'
                    : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 no-underline">
                    <div className="w-9 h-9 bg-[#10a24b] rounded-lg flex items-center justify-center">
                        <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight text-slate-900">GSTFlow</span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-slate-600 hover:text-[#10a24b] transition-colors no-underline"
                        >
                            {link.label}
                        </a>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-3">
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-slate-700 hover:text-[#10a24b] transition-colors no-underline px-4 py-2"
                    >
                        Login
                    </Link>
                    <Link
                        href="/auth/signup"
                        className="text-sm font-semibold text-white bg-[#10a24b] hover:bg-[#0d8a3e] px-5 py-2.5 rounded-lg transition-all no-underline shadow-sm shadow-[#10a24b]/20"
                    >
                        Get Started
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="md:hidden p-2 text-slate-700"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
                    >
                        <div className="px-6 py-4 space-y-3">
                            {NAV_LINKS.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="block text-sm font-medium text-slate-600 hover:text-[#10a24b] transition-colors no-underline py-2"
                                >
                                    {link.label}
                                </a>
                            ))}
                            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
                                <Link
                                    href="/auth/login"
                                    className="text-sm font-medium text-slate-700 text-center py-2.5 rounded-lg border border-slate-200 no-underline"
                                >
                                    Login
                                </Link>
                                <Link
                                    href="/auth/signup"
                                    className="text-sm font-semibold text-white bg-[#10a24b] text-center py-2.5 rounded-lg no-underline"
                                >
                                    Get Started
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.header>
    );
}
