'use client';

import { useState, useEffect } from 'react';
import { logout, getBusinessProfile, updateBusinessProfile } from '@/lib/api';

export default function SettingsPage() {
    const [businessName, setBusinessName] = useState('');
    const [gstin, setGstin] = useState('');
    const [state, setState] = useState('');
    const [businessType, setBusinessType] = useState('regular');
    const [fy, setFy] = useState('2025-26');
    const [prefix, setPrefix] = useState('INV-');
    const [nextNo, setNextNo] = useState('013');
    const [returnReminders, setReturnReminders] = useState(true);
    const [emailNotif, setEmailNotif] = useState(true);
    const [activeTab, setActiveTab] = useState<'business' | 'invoice' | 'notifications' | 'account'>('business');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getBusinessProfile().then((p) => {
            setBusinessName(p.name || '');
            setGstin(p.gstin || '');
            setState(p.state_name || '');
            setBusinessType(p.business_type || 'regular');
            setFy(p.financial_year || '2025-26');
            setPrefix(p.invoice_prefix || 'INV-');
        }).catch(() => { });
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateBusinessProfile({ name: businessName, gstin, state_name: state, business_type: businessType, financial_year: fy, invoice_prefix: prefix });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch { alert('Save failed'); }
        setSaving(false);
    };

    const tabs = [
        { id: 'business' as const, label: 'Business Profile', icon: 'business' },
        { id: 'invoice' as const, label: 'Invoice Settings', icon: 'receipt' },
        { id: 'notifications' as const, label: 'Notifications', icon: 'notifications' },
        { id: 'account' as const, label: 'Account', icon: 'person' },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Settings</h2>
                <p className="text-slate-500 mt-1">Manage your business profile and preferences</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Tabs */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-[#10a24b]/10 text-[#10a24b]' : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-lg ${activeTab === t.id ? 'text-[#10a24b]' : 'text-slate-400'}`}>{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Business Profile */}
                    {activeTab === 'business' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Business Profile</h3>
                            <div className="space-y-4">
                                <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Business Name</label><input value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                                <div><label className="text-sm font-medium text-slate-700 block mb-1.5">GSTIN</label><input value={gstin} onChange={e => setGstin(e.target.value.toUpperCase())} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 font-mono tracking-wider" maxLength={15} /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-sm font-medium text-slate-700 block mb-1.5">State</label><input readOnly value={state} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-slate-50 text-slate-500 cursor-not-allowed" /></div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 block mb-1.5">Business Type</label>
                                        <select value={businessType} onChange={e => setBusinessType(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 bg-white">
                                            <option value="regular">Regular</option>
                                            <option value="composition">Composition</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">Financial Year</label>
                                    <select value={fy} onChange={e => setFy(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 bg-white max-w-xs">
                                        <option value="2025-26">2025-26</option>
                                        <option value="2024-25">2024-25</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleSave} disabled={saving} className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2">{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}</button>
                        </div>
                    )}

                    {/* Invoice Settings */}
                    {activeTab === 'invoice' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900">Invoice Settings</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Number Prefix</label><input value={prefix} onChange={e => setPrefix(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                                <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Next Number</label><input type="number" value={nextNo} onChange={e => setNextNo(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <p className="text-sm text-slate-600">Preview: <span className="font-mono font-bold text-[#10a24b]">{prefix}{nextNo.padStart(3, '0')}</span></p>
                            </div>
                            <button onClick={handleSave} disabled={saving} className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">{saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}</button>
                        </div>
                    )}

                    {/* Notifications */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                            {[
                                { label: 'Return Reminders', desc: 'Remind before GSTR-1 & GSTR-3B due dates', checked: returnReminders, onChange: setReturnReminders },
                                { label: 'Email Notifications', desc: 'Get updates via email', checked: emailNotif, onChange: setEmailNotif },
                            ].map(n => (
                                <div key={n.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">{n.label}</p>
                                        <p className="text-xs text-slate-500">{n.desc}</p>
                                    </div>
                                    <button
                                        onClick={() => n.onChange(!n.checked)}
                                        className={`relative w-11 h-6 rounded-full transition-colors ${n.checked ? 'bg-[#10a24b]' : 'bg-slate-300'}`}
                                    >
                                        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${n.checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Account */}
                    {activeTab === 'account' && (
                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Account Actions</h3>
                                <div className="space-y-3">
                                    <button className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors">
                                        <span className="material-symbols-outlined text-slate-500">key</span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Change Password</p>
                                            <p className="text-xs text-slate-500">Update your account password</p>
                                        </div>
                                    </button>
                                    <button className="w-full flex items-center gap-3 p-4 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors">
                                        <span className="material-symbols-outlined text-slate-500">download</span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">Export All Data</p>
                                            <p className="text-xs text-slate-500">Download a complete archive of your data</p>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => { logout(); window.location.href = '/auth/login'; }}
                                        className="w-full flex items-center gap-3 p-4 bg-red-50 hover:bg-red-100 rounded-lg text-left transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-red-500">logout</span>
                                        <div>
                                            <p className="text-sm font-semibold text-red-700">Log Out</p>
                                            <p className="text-xs text-red-500">Sign out of your account</p>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            <div className="text-center text-xs text-slate-400 py-4">
                                GSTFlow v1.0.0 • Made with ❤️ in India 🇮🇳
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
