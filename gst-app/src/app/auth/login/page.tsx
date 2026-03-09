'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { login } from '@/lib/api';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(phone, password);
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7] px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 w-full max-w-[420px]"
            >
                {/* Brand */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-11 h-11 bg-[#10a24b] rounded-xl flex items-center justify-center">
                        <span className="material-symbols-outlined text-white">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">GSTFlow</h1>
                        <p className="text-xs text-slate-500">GST Automation Platform</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-5">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <h2 className="text-xl font-bold text-slate-900 mb-1">Welcome back</h2>
                    <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>

                    <div className="mb-4">
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

                    <div className="mb-6">
                        <label className="text-sm font-medium text-slate-700 mb-1.5 block">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                        />
                        <div className="text-right mt-2">
                            <Link href="/auth/reset-password" className="text-xs text-[#10a24b] font-medium hover:underline no-underline">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#10a24b] hover:bg-[#0d8a3e] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>

                    <p className="text-center mt-5 text-sm text-slate-500">
                        Don&apos;t have an account?{' '}
                        <Link href="/auth/signup" className="text-[#10a24b] font-semibold hover:underline no-underline">
                            Sign up
                        </Link>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
