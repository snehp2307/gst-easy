'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PublicPageLayout from '@/components/PublicPageLayout';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const FALLBACK_POSTS: Record<string, { title: string; content: string; author: string; created_at: string }> = {
    'gstr-1-guide': {
        title: 'Understanding GSTR-1: A Complete Guide for Indian Businesses',
        content: `GSTR-1 is a monthly or quarterly return that contains details of outward supplies made by a taxpayer. Every registered GST dealer needs to file GSTR-1 irrespective of whether there are any business transactions during the return filing period.\n\n## What is GSTR-1?\n\nGSTR-1 is the return for reporting all outward supplies (sales) made during a tax period. It captures:\n\n- **B2B Sales** — Invoices issued to registered dealers with GSTIN\n- **B2C Sales** — Sales to unregistered dealers/consumers\n- **Credit/Debit Notes** — Amendments to previously filed invoices\n- **Export Sales** — Supplies made outside India\n- **Nil Rated/Exempted** — Supplies that attract 0% GST\n\n## Filing Deadlines\n\n- **Monthly filers**: 11th of the next month\n- **QRMP scheme**: 13th of the month following the quarter\n\n## How GSTFlow Helps\n\nGSTFlow automatically categorizes your invoices into B2B and B2C buckets, calculates totals, and generates GSTR-1 ready data that you can directly upload to the GST portal.`,
        author: 'GSTFlow Team',
        created_at: '2026-02-15T10:00:00Z',
    },
    'ai-gst-compliance': {
        title: 'How AI is Transforming GST Compliance in India',
        content: `Artificial Intelligence is revolutionizing how Indian businesses handle their GST obligations.\n\n## The Problem\n\nManual GST compliance involves:\n- Data entry from hundreds of invoices\n- Cross-checking HSN codes and tax rates\n- Reconciling Input Tax Credits\n- Filing multiple returns monthly\n\n## How AI Solves This\n\n### 1. Automated Bill Scanning\nAI-powered OCR can extract vendor name, invoice number, amounts, and GST details from a photo of any bill — with 95%+ accuracy.\n\n### 2. Smart Classification\nMachine learning models automatically classify products by HSN code and apply correct GST rates.\n\n### 3. Anomaly Detection\nAI flags potential compliance issues before filing — like mismatched rates, missing GSTINs on high-value invoices, or ITC discrepancies.\n\n### 4. Predictive Analytics\nPredict GST liability, revenue trends, and cash flow — helping businesses plan better.`,
        author: 'Priya Sharma',
        created_at: '2026-02-28T10:00:00Z',
    },
    'itc-mistakes': {
        title: 'Input Tax Credit (ITC): Common Mistakes and How to Avoid Them',
        content: `Input Tax Credit is one of the most critical aspects of GST. Here are the top 5 mistakes businesses make:\n\n## 1. Not Matching GSTR-2A/2B\n\nAlways reconcile your purchase invoices against GSTR-2A/2B before claiming ITC.\n\n## 2. Claiming ITC on Blocked Items\n\nCertain items like food & beverages, personal vehicles, and membership clubs are blocked under Section 17(5).\n\n## 3. Missing Invoice Upload Deadlines\n\nITC can only be claimed if the supplier has uploaded the invoice. Chase your vendors!\n\n## 4. Incorrect GSTIN on Purchase Bills\n\nEven a single digit error in the GSTIN will result in ITC rejection.\n\n## 5. Not Reversing ITC on Non-Payment\n\nIf you haven't paid a vendor within 180 days, you must reverse the ITC claimed.\n\n## How GSTFlow Helps\n\nOur AI automatically detects these issues and alerts you before filing, preventing costly mistakes.`,
        author: 'Arjun Mehta',
        created_at: '2026-03-05T10:00:00Z',
    },
    'hsn-codes-guide': {
        title: 'HSN Codes Explained: What Every Business Owner Needs to Know',
        content: `The Harmonized System of Nomenclature (HSN) is an internationally standardized system of names and numbers to classify traded products.\n\n## Why HSN Codes Matter for GST\n\n- Businesses with turnover > ₹5 crore must mention 6-digit HSN codes\n- Businesses with turnover ₹1.5-5 crore need 4-digit codes\n- Small businesses below ₹1.5 crore can use 2-digit codes\n\n## Common HSN Codes\n\n| HSN Code | Product | GST Rate |\n|----------|---------|----------|\n| 8471 | Computers & Laptops | 18% |\n| 9401 | Furniture | 18% |\n| 4802 | Paper | 12% |\n| 8443 | Printers | 18% |\n| 6109 | T-Shirts | 5% |\n\n## GSTFlow Auto-Detection\n\nOur AI can suggest the correct HSN code based on your product description, reducing classification errors.`,
        author: 'GSTFlow Team',
        created_at: '2026-03-08T10:00:00Z',
    },
};

export default function BlogPostPage() {
    const params = useParams();
    const slug = params?.slug as string;
    const [post, setPost] = useState<{ title: string; content: string; author: string; created_at: string } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/blog/${slug}`)
            .then(r => r.json())
            .then(setPost)
            .catch(() => setPost(FALLBACK_POSTS[slug] || null))
            .finally(() => setLoading(false));
    }, [slug]);

    if (loading) return <PublicPageLayout><div className="max-w-3xl mx-auto px-6 py-20 text-center text-slate-400">Loading...</div></PublicPageLayout>;
    if (!post) return <PublicPageLayout><div className="max-w-3xl mx-auto px-6 py-20 text-center"><h1 className="text-2xl font-bold text-slate-900">Post not found</h1><Link href="/blog" className="text-[#10a24b] mt-4 inline-block">← Back to Blog</Link></div></PublicPageLayout>;

    return (
        <PublicPageLayout>
            <article className="max-w-3xl mx-auto px-6 py-20">
                <Link href="/blog" className="text-sm text-[#10a24b] font-semibold no-underline mb-6 inline-block">← Back to Blog</Link>
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">{post.title}</h1>
                <div className="flex items-center gap-3 mt-4 mb-10">
                    <div className="w-8 h-8 rounded-full bg-[#10a24b]/10 text-[#10a24b] flex items-center justify-center text-xs font-bold">{post.author.charAt(0)}</div>
                    <span className="text-sm text-slate-500">{post.author} · {new Date(post.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</div>
            </article>
        </PublicPageLayout>
    );
}
