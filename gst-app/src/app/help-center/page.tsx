'use client';

import { useState, useEffect } from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface Article { id: string; title: string; content: string; category: string; created_at: string; }

const FALLBACK_ARTICLES: Article[] = [
    { id: '1', title: 'How to create your first invoice', content: 'Go to Invoices → Create Invoice. Fill in customer details, add line items with HSN codes, and the system will auto-calculate GST.', category: 'Getting Started', created_at: '2026-01-10T00:00:00Z' },
    { id: '2', title: 'Setting up your business profile', content: 'Navigate to Settings → Business Profile. Enter your business name, GSTIN, state, PAN, and address. This information appears on all invoices.', category: 'Getting Started', created_at: '2026-01-12T00:00:00Z' },
    { id: '3', title: 'Scanning bills with AI', content: 'Go to Bills → Upload Bill. Take a clear photo of any purchase bill. Our AI extracts vendor name, amounts, GST details, and creates a purchase record automatically.', category: 'AI Features', created_at: '2026-01-15T00:00:00Z' },
    { id: '4', title: 'Understanding GST calculations', content: 'GSTFlow uses state codes to determine CGST+SGST (intra-state) or IGST (inter-state). The system auto-detects based on your business state and customer state.', category: 'GST Guide', created_at: '2026-01-20T00:00:00Z' },
    { id: '5', title: 'Exporting reports', content: 'Go to Reports to download CSV, PDF, or JSON exports of your invoices and GST data. GSTR-1 and GSTR-3B formats are supported.', category: 'Reports', created_at: '2026-02-01T00:00:00Z' },
    { id: '6', title: 'Managing inventory', content: 'Add products in the Products page with HSN codes, GST rates, and stock quantities. The system tracks low stock and alerts you when items near threshold.', category: 'Inventory', created_at: '2026-02-10T00:00:00Z' },
    { id: '7', title: 'Using the AI Chat', content: 'Open AI Assistant and type natural language queries like "How much GST do I owe?" or "Show unpaid invoices". The AI queries your real data.', category: 'AI Features', created_at: '2026-02-15T00:00:00Z' },
    { id: '8', title: 'Recording payments', content: 'Go to Payments → Record Payment. Select the invoice, enter amount, date, and payment mode (UPI, bank transfer, cash, cheque).', category: 'Payments', created_at: '2026-02-20T00:00:00Z' },
];

export default function HelpCenterPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [search, setSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState('All');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/help`)
            .then(r => r.json())
            .then(setArticles)
            .catch(() => setArticles(FALLBACK_ARTICLES))
            .finally(() => setLoading(false));
    }, []);

    const categories = ['All', ...Array.from(new Set(articles.map(a => a.category)))];
    const filtered = articles.filter(a => {
        const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase());
        const matchCat = selectedCat === 'All' || a.category === selectedCat;
        return matchSearch && matchCat;
    });

    return (
        <PublicPageLayout>
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Support</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Help Center</h1>
                    <p className="text-lg text-slate-500 mt-4">Find answers to common questions about GSTFlow.</p>
                </div>

                <div className="relative max-w-lg mx-auto mb-8">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 shadow-sm" placeholder="Search help articles..." />
                </div>

                <div className="flex gap-2 mb-8 flex-wrap justify-center">
                    {categories.map(c => (
                        <button key={c} onClick={() => setSelectedCat(c)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCat === c ? 'bg-[#10a24b] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{c}</button>
                    ))}
                </div>

                <div className="space-y-3">
                    {filtered.map(a => (
                        <div key={a.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <button onClick={() => setExpanded(expanded === a.id ? null : a.id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors">
                                <div>
                                    <span className="text-[10px] font-bold text-[#10a24b] bg-[#10a24b]/10 px-2 py-0.5 rounded-full uppercase">{a.category}</span>
                                    <h3 className="text-sm font-bold text-slate-900 mt-1.5">{a.title}</h3>
                                </div>
                                <span className={`material-symbols-outlined text-slate-400 transition-transform ${expanded === a.id ? 'rotate-180' : ''}`}>expand_more</span>
                            </button>
                            {expanded === a.id && <div className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">{a.content}</div>}
                        </div>
                    ))}
                    {filtered.length === 0 && <p className="text-center text-slate-400 py-12">{loading ? 'Loading...' : 'No articles found.'}</p>}
                </div>
            </div>
        </PublicPageLayout>
    );
}
