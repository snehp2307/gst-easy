'use client';

import { useState } from 'react';

export default function SettingsPage() {
    const [businessName, setBusinessName] = useState('Ravi Hardware Store');
    const [gstin, setGstin] = useState('27AABCU9603R1ZP');
    const [state, setState] = useState('Maharashtra');
    const [businessType, setBusinessType] = useState('regular');
    const [fy, setFy] = useState('2025-26');
    const [prefix, setPrefix] = useState('INV-');
    const [nextNo, setNextNo] = useState('013');
    const [returnReminders, setReturnReminders] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);

    return (
        <div className="container animate-fadeIn" style={{ paddingTop: '16px' }}>
            <h1 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '20px' }}>Settings</h1>

            {/* Business Profile */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Business Profile
                </h2>

                <div className="form-group">
                    <label className="form-label">Business Name</label>
                    <input className="form-input" value={businessName} onChange={e => setBusinessName(e.target.value)} />
                </div>

                <div className="form-group">
                    <label className="form-label">GSTIN</label>
                    <input className="form-input" value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())}
                        style={{ fontFamily: 'monospace', letterSpacing: '1px' }} maxLength={15} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">State</label>
                        <input className="form-input" value={state} readOnly style={{ background: 'var(--border-light)' }} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Business Type</label>
                        <select className="form-input form-select" value={businessType} onChange={e => setBusinessType(e.target.value)}>
                            <option value="regular">Regular</option>
                            <option value="composition">Composition</option>
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Financial Year</label>
                    <select className="form-input form-select" value={fy} onChange={e => setFy(e.target.value)}>
                        <option value="2025-26">2025-26</option>
                        <option value="2024-25">2024-25</option>
                    </select>
                </div>
            </div>

            {/* Invoice Settings */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Invoice Settings
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                        <label className="form-label">Number Prefix</label>
                        <input className="form-input" value={prefix} onChange={e => setPrefix(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Next Number</label>
                        <input className="form-input" value={nextNo} onChange={e => setNextNo(e.target.value)} type="number" />
                    </div>
                </div>
            </div>

            {/* Notifications */}
            <div className="card" style={{ marginBottom: '16px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Notifications
                </h2>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>Return Reminders</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Remind before GSTR-1 & GSTR-3B due dates</div>
                    </div>
                    <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={returnReminders} onChange={e => setReturnReminders(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                            position: 'absolute', inset: 0, borderRadius: '12px', transition: 'background 0.2s',
                            background: returnReminders ? 'var(--primary)' : 'var(--border)',
                        }}>
                            <span style={{
                                position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%',
                                background: 'white', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s',
                                transform: returnReminders ? 'translateX(22px)' : 'translateX(2px)',
                            }} />
                        </span>
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                    <div>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>Email Notifications</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Get updates via email</div>
                    </div>
                    <label style={{ position: 'relative', width: '44px', height: '24px', cursor: 'pointer' }}>
                        <input type="checkbox" checked={emailNotif} onChange={e => setEmailNotif(e.target.checked)}
                            style={{ opacity: 0, width: 0, height: 0 }} />
                        <span style={{
                            position: 'absolute', inset: 0, borderRadius: '12px', transition: 'background 0.2s',
                            background: emailNotif ? 'var(--primary)' : 'var(--border)',
                        }}>
                            <span style={{
                                position: 'absolute', top: '2px', width: '20px', height: '20px', borderRadius: '50%',
                                background: 'white', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.2s',
                                transform: emailNotif ? 'translateX(22px)' : 'translateX(2px)',
                            }} />
                        </span>
                    </label>
                </div>
            </div>

            {/* Account Actions */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Account
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>🔑 Change Password</button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>📥 Export All Data</button>
                    <button className="btn btn-ghost" style={{ justifyContent: 'flex-start', color: 'var(--red)' }}>🚪 Log Out</button>
                </div>
            </div>

            <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-light)', paddingBottom: '24px' }}>
                GST Easy v1.0.0 • Made in India 🇮🇳
            </div>
        </div>
    );
}
