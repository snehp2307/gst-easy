'use client';

import { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
function getToken() { return typeof window !== 'undefined' ? localStorage.getItem('gst_token') : null; }
async function apiFetch(path: string, opts?: RequestInit) {
    const token = getToken();
    const res = await fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts?.headers } });
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
}

interface Vendor { id: string; name: string; gstin: string | null; phone: string | null; email: string | null; created_at: string; }

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', gstin: '', phone: '', email: '', state_code: '27' });
    const [loading, setLoading] = useState(true);

    const load = () => {
        const q = search ? `&search=${search}` : '';
        apiFetch(`/vendors?page=1&page_size=50${q}`)
            .then(d => { setVendors(d.vendors || []); setTotal(d.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(load, [search]);

    const handleCreate = async () => {
        await apiFetch('/vendors', { method: 'POST', body: JSON.stringify(form) });
        setShowForm(false);
        setForm({ name: '', gstin: '', phone: '', email: '', state_code: '27' });
        load();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Vendors</h2>
                    <p className="text-slate-500 mt-1">{total} total vendors</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Add Vendor
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#10a24b]/20 outline-none" placeholder="Search vendors..." />
                </div>
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">New Vendor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">GSTIN</label><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 font-mono" placeholder="27AAACG1234F1Z5" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button onClick={handleCreate} className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors">Save Vendor</button>
                        <button onClick={() => setShowForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GSTIN</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Phone</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Added</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {vendors.map(v => (
                            <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">{v.name[0]?.toUpperCase()}</div>
                                        <span className="text-sm font-medium text-slate-900">{v.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600 font-mono">{v.gstin || '—'}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{v.phone || '—'}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{v.email || '—'}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(v.created_at).toLocaleDateString('en-IN')}</td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1 text-slate-400 hover:text-[#10a24b] transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                                    <button className="p-1 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                                </td>
                            </tr>
                        ))}
                        {vendors.length === 0 && (
                            <tr><td colSpan={6} className="text-center text-slate-400 py-12">{loading ? 'Loading...' : 'No vendors yet'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
