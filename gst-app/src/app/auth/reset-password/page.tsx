'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function ResetPasswordPage() {
    const [phone, setPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder — API call would go here
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-[420px]"
            >
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-11 h-11 bg-[#10a24b] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">GSTFlow</h1>
                        <p className="text-xs text-slate-500">GST Automation Platform</p>
                    </div>
                </div>

                {submitted ? (
                    <div className="text-center">
                        <div className="w-16 h-16 mx-auto bg-green-50 rounded-full flex items-center justify-center mb-4">
                            <span className="material-symbols-outlined text-[#10a24b] text-3xl">check_circle</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Check your phone</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            If an account exists for {phone}, you will receive a password reset link.
                        </p>
                        <Link
                            href="/auth/login"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-[#10a24b] hover:underline no-underline"
                        >
                            <span className="material-symbols-outlined text-lg">arrow_back</span>
                            Back to login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Reset password</h2>
                        <p className="text-sm text-slate-500 mb-6">
                            Enter your phone number and we&apos;ll send you a reset link.
                        </p>

                        <div className="mb-6">
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Phone</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="10 digit phone"
                                required
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-[#10a24b] hover:bg-[#0d8a3e] text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                            Send Reset Link
                        </button>

                        <p className="text-center mt-5 text-sm text-slate-500">
                            Remember your password?{' '}
                            <Link href="/auth/login" className="text-[#10a24b] font-semibold hover:underline no-underline">
                                Sign in
                            </Link>
                        </p>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
