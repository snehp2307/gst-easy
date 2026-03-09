'use client';

import { useState } from 'react';
import PublicPageLayout from '@/components/PublicPageLayout';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [sent, setSent] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSent(true);
        setTimeout(() => setSent(false), 5000);
        setForm({ name: '', email: '', subject: '', message: '' });
    };

    return (
        <PublicPageLayout>
            <div className="max-w-5xl mx-auto px-6 py-20">
                <div className="text-center mb-16">
                    <span className="text-sm font-bold text-[#10a24b] bg-[#10a24b]/10 px-3 py-1 rounded-full uppercase tracking-wider">Contact Us</span>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mt-6">Get in touch</h1>
                    <p className="text-lg text-slate-500 mt-4">Have a question? We&apos;d love to hear from you.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div>
                        <div className="space-y-6 mb-10">
                            {[
                                { icon: 'mail', label: 'Email', value: 'support@gstflow.in', href: 'mailto:support@gstflow.in' },
                                { icon: 'phone', label: 'Phone', value: '+91 80 4567 8900', href: 'tel:+918045678900' },
                                { icon: 'location_on', label: 'Office', value: 'HSR Layout, Bangalore 560102', href: '#' },
                            ].map(c => (
                                <a key={c.label} href={c.href} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-shadow no-underline">
                                    <div className="w-10 h-10 bg-[#10a24b]/10 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-[#10a24b]">{c.icon}</span></div>
                                    <div><p className="text-xs text-slate-400">{c.label}</p><p className="text-sm font-semibold text-slate-900">{c.value}</p></div>
                                </a>
                            ))}
                        </div>
                        <div className="bg-[#10a24b]/5 border border-[#10a24b]/20 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-slate-900 mb-2">Business Hours</h3>
                            <p className="text-sm text-slate-600">Monday–Friday: 9:00 AM – 6:00 PM IST</p>
                            <p className="text-sm text-slate-600">Saturday: 10:00 AM – 2:00 PM IST</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="space-y-4">
                            <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                            <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                            <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10" /></div>
                            <div><label className="text-sm font-medium text-slate-700 block mb-1.5">Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-[#10a24b] focus:ring-2 focus:ring-[#10a24b]/10 resize-none" /></div>
                            <button type="submit" className="w-full bg-[#10a24b] hover:bg-[#10a24b]/90 text-white py-3 rounded-lg font-bold text-sm transition-colors">Send Message</button>
                            {sent && <p className="text-sm text-[#10a24b] font-semibold text-center">✓ Message sent! We&apos;ll get back to you within 24 hours.</p>}
                        </div>
                    </form>
                </div>
            </div>
        </PublicPageLayout>
    );
}
