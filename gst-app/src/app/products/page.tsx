'use client';

import { useState, useEffect } from 'react';
import { listProducts, createProduct, deleteProduct, type Product } from '@/lib/api';
import { formatPaiseClient } from '@/lib/api-helpers';

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', description: '', hsn_code: '', unit: 'NOS', unit_price: 0, gst_rate: 18, stock_quantity: 0, low_stock_threshold: 10, sku: '', category: '' });
    const [saving, setSaving] = useState(false);
    const fmt = formatPaiseClient;

    const load = () => {
        setLoading(true);
        listProducts({ search: search || undefined })
            .then(d => { setProducts(d.products); setTotal(d.total); })
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

    const handleCreate = async () => {
        setSaving(true);
        try {
            await createProduct({ ...form, unit_price: Math.round(form.unit_price * 100) });
            setShowForm(false);
            setForm({ name: '', description: '', hsn_code: '', unit: 'NOS', unit_price: 0, gst_rate: 18, stock_quantity: 0, low_stock_threshold: 10, sku: '', category: '' });
            load();
        } catch { }
        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this product?')) return;
        try { await deleteProduct(id); load(); } catch { }
    };

    const getStatus = (p: Product) => {
        if (p.stock_quantity === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-800 border-red-200' };
        if (p.stock_quantity <= p.low_stock_threshold) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-800 border-amber-200' };
        return { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Products & Inventory</h2>
                    <p className="text-slate-500 mt-1">{total} products in catalog</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-sm">add</span>Add Product
                </button>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative max-w-md">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">search</span>
                    <input type="text" value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#10a24b]/20 outline-none" placeholder="Search products, HSN codes..." />
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">New Product</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">HSN Code</label><input value={form.hsn_code} onChange={e => setForm({ ...form, hsn_code: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 font-mono" placeholder="8471" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">SKU</label><input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Price (₹)</label><input type="number" value={form.unit_price} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">GST Rate (%)</label>
                            <select value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 bg-white">
                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                            </select>
                        </div>
                        <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Stock Quantity</label><input type="number" value={form.stock_quantity} onChange={e => setForm({ ...form, stock_quantity: Number(e.target.value) })} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button onClick={handleCreate} disabled={saving || !form.name} className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">{saving ? 'Saving...' : 'Save Product'}</button>
                        <button onClick={() => setShowForm(false)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">HSN Code</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">GST Rate</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {products.map(p => {
                            const status = getStatus(p);
                            return (
                                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-[#10a24b]/10 text-[#10a24b] flex items-center justify-center"><span className="material-symbols-outlined text-sm">inventory_2</span></div>
                                            <span className="text-sm font-medium text-slate-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">{p.hsn_code || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-[#10a24b] font-semibold">{p.gst_rate}%</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">₹{fmt(p.unit_price)}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{p.stock_quantity} units</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${status.cls}`}>{status.label}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1 text-slate-400 hover:text-[#10a24b] transition-colors"><span className="material-symbols-outlined text-lg">edit</span></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-1 text-slate-400 hover:text-red-500 transition-colors"><span className="material-symbols-outlined text-lg">delete</span></button>
                                    </td>
                                </tr>
                            );
                        })}
                        {products.length === 0 && (
                            <tr><td colSpan={7} className="text-center text-slate-400 py-12">{loading ? 'Loading...' : 'No products yet. Add your first product!'}</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
