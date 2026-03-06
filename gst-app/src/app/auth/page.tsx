'use client';

import { useState } from 'react';
import { login, register, setupBusiness } from '@/lib/api';

type Step = 'login' | 'signup' | 'business';

export default function AuthPage() {
    const [step, setStep] = useState<Step>('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Login fields
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Business fields
    const [bizName, setBizName] = useState('');
    const [gstin, setGstin] = useState('');
    const [stateCode, setStateCode] = useState('');
    const [stateName, setStateName] = useState('');

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(phone, password);
            window.location.href = '/';
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Login failed. Check your phone & password.');
        } finally {
            setLoading(false);
        }
    }

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        try {
            await register(phone, password, name);
            setStep('business');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Registration failed. Phone may already be registered.');
        } finally {
            setLoading(false);
        }
    }

    async function handleBusiness(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const fy = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
            await setupBusiness({
                name: bizName,
                gstin,
                state_code: stateCode,
                state_name: stateName,
                financial_year: fy,
            });
            window.location.href = '/';
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save business info.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
        }}>
            {/* Logo */}
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                    fontSize: '42px', fontWeight: '900', color: 'white',
                    letterSpacing: '-1px', marginBottom: '4px',
                }}>
                    GST Easy
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)' }}>
                    Simple GST for Indian businesses
                </div>
            </div>

            {/* Card */}
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '28px',
                width: '100%',
                maxWidth: '380px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
                {/* Tabs — only show for login/signup */}
                {step !== 'business' && (
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        background: '#f1f5f9',
                        borderRadius: '10px',
                        padding: '4px',
                        marginBottom: '24px',
                    }}>
                        <button
                            onClick={() => { setStep('login'); setError(''); }}
                            style={{
                                flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                                fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                                background: step === 'login' ? 'white' : 'transparent',
                                color: step === 'login' ? '#6366f1' : '#64748b',
                                boxShadow: step === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => { setStep('signup'); setError(''); }}
                            style={{
                                flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                                fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                                background: step === 'signup' ? 'white' : 'transparent',
                                color: step === 'signup' ? '#6366f1' : '#64748b',
                                boxShadow: step === 'signup' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{
                        background: '#fef2f2', color: '#dc2626',
                        padding: '10px 14px', borderRadius: '8px',
                        fontSize: '13px', marginBottom: '16px',
                    }}>
                        {error}
                    </div>
                )}

                {/* Login Form */}
                {step === 'login' && (
                    <form onSubmit={handleLogin}>
                        <label style={labelStyle}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="9876543210"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        <label style={labelStyle}>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        <button type="submit" disabled={loading} style={btnStyle}>
                            {loading ? 'Logging in...' : 'Login →'}
                        </button>
                    </form>
                )}

                {/* Signup Form */}
                {step === 'signup' && (
                    <form onSubmit={handleSignup}>
                        <label style={labelStyle}>Your Name</label>
                        <input
                            type="text"
                            placeholder="Rajesh Kumar"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        <label style={labelStyle}>Phone Number</label>
                        <input
                            type="tel"
                            placeholder="9876543210"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        <label style={labelStyle}>Password</label>
                        <input
                            type="password"
                            placeholder="Min 6 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                            style={inputStyle}
                        />
                        <button type="submit" disabled={loading} style={btnStyle}>
                            {loading ? 'Creating account...' : 'Create Account →'}
                        </button>
                    </form>
                )}

                {/* Business Setup Form */}
                {step === 'business' && (
                    <form onSubmit={handleBusiness}>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏢</div>
                            <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Business Setup</h2>
                            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                Tell us about your business
                            </p>
                        </div>
                        <label style={labelStyle}>Business Name</label>
                        <input
                            type="text"
                            placeholder="Kumar Traders"
                            value={bizName}
                            onChange={e => setBizName(e.target.value)}
                            required
                            style={inputStyle}
                        />
                        <label style={labelStyle}>GSTIN (Optional)</label>
                        <input
                            type="text"
                            placeholder="27AABCU9603R1ZM"
                            value={gstin}
                            onChange={e => setGstin(e.target.value.toUpperCase())}
                            maxLength={15}
                            style={inputStyle}
                        />
                        <label style={labelStyle}>State</label>
                        <select
                            value={stateCode}
                            onChange={e => {
                                setStateCode(e.target.value);
                                const opt = e.target.selectedOptions[0];
                                setStateName(opt?.text?.split(' - ')[1] || '');
                            }}
                            required
                            style={inputStyle}
                        >
                            <option value="">Select State</option>
                            <option value="01">01 - Jammu & Kashmir</option>
                            <option value="02">02 - Himachal Pradesh</option>
                            <option value="03">03 - Punjab</option>
                            <option value="04">04 - Chandigarh</option>
                            <option value="05">05 - Uttarakhand</option>
                            <option value="06">06 - Haryana</option>
                            <option value="07">07 - Delhi</option>
                            <option value="08">08 - Rajasthan</option>
                            <option value="09">09 - Uttar Pradesh</option>
                            <option value="10">10 - Bihar</option>
                            <option value="11">11 - Sikkim</option>
                            <option value="12">12 - Arunachal Pradesh</option>
                            <option value="13">13 - Nagaland</option>
                            <option value="14">14 - Manipur</option>
                            <option value="15">15 - Mizoram</option>
                            <option value="16">16 - Tripura</option>
                            <option value="17">17 - Meghalaya</option>
                            <option value="18">18 - Assam</option>
                            <option value="19">19 - West Bengal</option>
                            <option value="20">20 - Jharkhand</option>
                            <option value="21">21 - Odisha</option>
                            <option value="22">22 - Chhattisgarh</option>
                            <option value="23">23 - Madhya Pradesh</option>
                            <option value="24">24 - Gujarat</option>
                            <option value="27">27 - Maharashtra</option>
                            <option value="29">29 - Karnataka</option>
                            <option value="32">32 - Kerala</option>
                            <option value="33">33 - Tamil Nadu</option>
                            <option value="36">36 - Telangana</option>
                            <option value="37">37 - Andhra Pradesh</option>
                            <option value="97">97 - Other Territory</option>
                        </select>
                        <button type="submit" disabled={loading} style={btnStyle}>
                            {loading ? 'Saving...' : 'Start Using GST Easy →'}
                        </button>
                    </form>
                )}
            </div>

            {/* Footer */}
            <div style={{
                marginTop: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.7)',
                textAlign: 'center',
            }}>
                🔒 Data stored securely on your device
            </div>
        </div>
    );
}

// Shared styles
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
    marginTop: '14px',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 14px',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
};

const btnStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '20px',
    transition: 'opacity 0.2s',
};
