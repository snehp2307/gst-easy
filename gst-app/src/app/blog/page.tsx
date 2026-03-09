'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicPageLayout from '@/components/PublicPageLayout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface BlogPost {
    id: string;
    title: string;
    slug: string;
    content: string;
    author: string;
    created_at: string;
}

export default function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/blog`)
            .then(r => r.json())
            .then(setPosts)
            .catch(() => {
                // Fallback static posts if API unavailable
                setPosts([
                    { id: '1', title: 'Understanding GSTR-1: A Complete Guide for Indian Businesses', slug: 'gstr-1-guide', content: 'GSTR-1 is a monthly or quarterly return that contains details of outward supplies made by a taxpayer. Every registered GST dealer needs to file GSTR-1 irrespective of whether there are any business transactions during the return filing period...', author: 'GSTFlow Team', created_at: '2026-02-15T10:00:00Z' },
                    { id: '2', title: 'How AI is Transforming GST Compliance in India', slug: 'ai-gst-compliance', content: 'Artificial Intelligence is revolutionizing how Indian businesses handle their GST obligations. From automated invoice scanning to predictive analytics, AI helps reduce errors by up to 95%...', author: 'Priya Sharma', created_at: '2026-02-28T10:00:00Z' },
                    { id: '3', title: 'Input Tax Credit (ITC): Common Mistakes and How to Avoid Them', slug: 'itc-mistakes', content: 'Input Tax Credit is one of the most critical aspects of GST. However, many businesses make errors that lead to rejected ITC claims. Here are the top 5 mistakes...', author: 'Arjun Mehta', created_at: '2026-03-05T10:00:00Z' },
                    { id: '4', title: 'HSN Codes Explained: What Every Business Owner Needs to Know', slug: 'hsn-codes-guide', content: 'The Harmonized System of Nomenclature (HSN) is an internationally standardized system of names and numbers to classify traded products. Understanding HSN codes is crucial for correct GST calculation...', author: 'GSTFlow Team', created_at: '2026-03-08T10:00:00Z' },
                ]);
            })
            .finally(() => setLoading(false));
    }, []);

    return (
        <PublicPageLayout>
            <div className="max-w-4xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Blog</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">GST insights & guides</h1>
                    <p className="text-lg text-slate-500 mt-4">Expert articles on GST compliance, tax updates, and business automation.</p>
                </div>
                <div className="space-y-8">
                    {posts.map(p => (
                        <Link key={p.id} href={`/blog/${p.slug}`} className="block bg-white p-8 rounded-2xl border border-slate-200 hover:shadow-lg transition-shadow no-underline group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-full bg-[#10a24b]/10 text-[#10a24b] flex items-center justify-center text-xs font-bold">{p.author.charAt(0)}</div>
                                <span className="text-xs font-medium text-slate-500">{p.author} · {new Date(p.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 group-hover:text-[#10a24b] transition-colors">{p.title}</h2>
                            <p className="text-sm text-slate-500 mt-2 line-clamp-2">{p.content}</p>
                            <span className="text-sm text-[#10a24b] font-semibold mt-4 inline-block">Read more →</span>
                        </Link>
                    ))}
                    {loading && <p className="text-center text-slate-400 py-12">Loading posts...</p>}
                </div>
            </div>
        </PublicPageLayout>
    );
}
