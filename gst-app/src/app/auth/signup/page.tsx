'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { register, setupBusiness } from '@/lib/api';

type Step = 'signup' | 'business';

export default function SignupPage() {
    const [step, setStep] = useState<Step>('signup');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Signup fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Business setup fields
    const [bizName, setBizName] = useState('');
    const [stateCode, setStateCode] = useState('27');
    const [stateName, setStateName] = useState('Maharashtra');
    const [gstin, setGstin] = useState('');

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(phone, password, name);
            setStep('business');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleBusiness = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await setupBusiness({
                name: bizName,
                state_code: stateCode,
                state_name: stateName,
                financial_year: '2025-26',
                gstin: gstin || undefined,
            });
            window.location.href = '/dashboard';
        } catch (err: any) {
            setError(err.message || 'Business setup failed');
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

                {step === 'signup' && (
                    <form onSubmit={handleSignup}>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Create account</h2>
                        <p className="text-sm text-slate-500 mb-6">Start automating your GST</p>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Full Name</label>
                            <input
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Rahul Sharma"
                                required
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                            />
                        </div>

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
                                placeholder="Min 6 characters"
                                required
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#10a24b] hover:bg-[#0d8a3e] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>

                        <p className="text-center mt-5 text-sm text-slate-500">
                            Already have an account?{' '}
                            <Link href="/auth/login" className="text-[#10a24b] font-semibold hover:underline no-underline">
                                Sign in
                            </Link>
                        </p>
                    </form>
                )}

                {step === 'business' && (
                    <form onSubmit={handleBusiness}>
                        <h2 className="text-xl font-bold text-slate-900 mb-1">Set up your business</h2>
                        <p className="text-sm text-slate-500 mb-6">Tell us about your company</p>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">Business Name *</label>
                            <input
                                value={bizName}
                                onChange={(e) => setBizName(e.target.value)}
                                placeholder="Acme Corp Pvt Ltd"
                                required
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="text-sm font-medium text-slate-700 mb-1.5 block">GSTIN (optional)</label>
                            <input
                                value={gstin}
                                onChange={(e) => setGstin(e.target.value.toUpperCase())}
                                placeholder="27AAACG1234F1Z5"
                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">State Code</label>
                                <input
                                    value={stateCode}
                                    onChange={(e) => setStateCode(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 mb-1.5 block">State Name</label>
                                <input
                                    value={stateName}
                                    onChange={(e) => setStateName(e.target.value)}
                                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 transition-all"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#10a24b] hover:bg-[#0d8a3e] text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-60"
                        >
                            {loading ? 'Setting up...' : 'Complete Setup'}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    );
}
