'use client';

import { useState } from 'react';
import { login, register, setupBusiness } from '@/lib/api';

type Step = 'login' | 'signup' | 'business';

export default function AuthPage() {
    const [step, setStep] = useState<Step>('login');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Login state
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Signup state
    const [name, setName] = useState('');
    const [signupPhone, setSignupPhone] = useState('');
    const [signupPassword, setSignupPassword] = useState('');

    // Business setup
    const [bizName, setBizName] = useState('');
    const [stateCode, setStateCode] = useState('27');
    const [stateName, setStateName] = useState('Maharashtra');
    const [gstin, setGstin] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(phone, password);
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally { setLoading(false); }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(name, signupPhone, signupPassword);
            setStep('business');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally { setLoading(false); }
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
            window.location.href = '/';
        } catch (err: any) {
            setError(err.message || 'Business setup failed');
        } finally { setLoading(false); }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Brand */}
                <div className="auth-brand">
                    <div style={{
                        width: '44px', height: '44px', background: '#10a24b',
                        borderRadius: '12px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: '#fff',
                    }}>
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>GSTFlow</h1>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>GST Automation Platform</p>
                    </div>
                </div>

                {error && (
                    <div style={{ background: '#fef2f2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '20px' }}>
                        {error}
                    </div>
                )}

                {/* Login */}
                {step === 'login' && (
                    <form onSubmit={handleLogin}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Welcome back</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Sign in to your account</p>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Phone</label>
                            <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10 digit phone" required />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
                        </div>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
                            Don&apos;t have an account?{' '}
                            <button type="button" onClick={() => { setStep('signup'); setError(''); }} style={{ color: '#10a24b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                Sign up
                            </button>
                        </p>
                    </form>
                )}

                {/* Signup */}
                {step === 'signup' && (
                    <form onSubmit={handleSignup}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Create account</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Start automating your GST</p>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Full Name</label>
                            <input className="form-input" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Sharma" required />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Phone</label>
                            <input className="form-input" type="tel" value={signupPhone} onChange={e => setSignupPhone(e.target.value)} placeholder="10 digit phone" required />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label className="form-label">Password</label>
                            <input className="form-input" type="password" value={signupPassword} onChange={e => setSignupPassword(e.target.value)} placeholder="Min 6 characters" required />
                        </div>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                            {loading ? 'Creating...' : 'Create Account'}
                        </button>
                        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748b' }}>
                            Already have an account?{' '}
                            <button type="button" onClick={() => { setStep('login'); setError(''); }} style={{ color: '#10a24b', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>
                                Sign in
                            </button>
                        </p>
                    </form>
                )}

                {/* Business Setup */}
                {step === 'business' && (
                    <form onSubmit={handleBusiness}>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>Set up your business</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>Tell us about your company</p>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">Business Name *</label>
                            <input className="form-input" value={bizName} onChange={e => setBizName(e.target.value)} placeholder="Acme Corp Pvt Ltd" required />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label className="form-label">GSTIN (optional)</label>
                            <input className="form-input" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} placeholder="27AAACG1234F1Z5" />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label className="form-label">State Code</label>
                                <input className="form-input" value={stateCode} onChange={e => setStateCode(e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">State Name</label>
                                <input className="form-input" value={stateName} onChange={e => setStateName(e.target.value)} />
                            </div>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
                            {loading ? 'Setting up...' : 'Complete Setup'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
