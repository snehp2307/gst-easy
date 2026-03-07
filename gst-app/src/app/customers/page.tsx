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

interface Customer { id: string; name: string; gstin: string | null; phone: string | null; email: string | null; created_at: string; }

export default function CustomersPage() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', gstin: '', phone: '', email: '', state_code: '27' });
    const [loading, setLoading] = useState(true);

    const load = () => {
        const q = search ? `&search=${search}` : '';
        apiFetch(`/customers?page=1&page_size=50${q}`)
            .then(d => { setCustomers(d.customers || []); setTotal(d.total || 0); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(load, [search]);

    const handleCreate = async () => {
        await apiFetch('/customers', { method: 'POST', body: JSON.stringify(form) });
        setShowForm(false);
        setForm({ name: '', gstin: '', phone: '', email: '', state_code: '27' });
        load();
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Customers</h2>
                    <p style={{ color: '#64748b', marginTop: '4px' }}>{total} total customers</p>
                </div>
                <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    Add Customer
                </button>
            </div>

            {/* Search */}
            <div style={{ marginBottom: '24px', maxWidth: '400px' }}>
                <input className="form-input" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Add Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontWeight: 600, marginBottom: '16px' }}>New Customer</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label className="form-label">Name *</label>
                            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">GSTIN</label>
                            <input className="form-input" value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder="27AAACG1234F1Z5" />
                        </div>
                        <div>
                            <label className="form-label">Phone</label>
                            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="form-label">Email</label>
                            <input className="form-input" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                        <button className="btn-primary" onClick={handleCreate}>Save Customer</button>
                        <button className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead><tr><th>Name</th><th>GSTIN</th><th>Phone</th><th>Email</th><th>Added</th></tr></thead>
                    <tbody>
                        {customers.map(c => (
                            <tr key={c.id}>
                                <td style={{ fontWeight: 500 }}>{c.name}</td>
                                <td style={{ fontFamily: 'monospace', fontSize: '13px' }}>{c.gstin || '—'}</td>
                                <td>{c.phone || '—'}</td>
                                <td>{c.email || '—'}</td>
                                <td style={{ color: '#64748b' }}>{new Date(c.created_at).toLocaleDateString('en-IN')}</td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '48px' }}>{loading ? 'Loading...' : 'No customers yet'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
