'use client';

import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const TESTIMONIALS = [
    {
        name: 'Rajesh Gupta',
        role: 'Owner, Gupta Electronics',
        quote: 'GSTFlow has saved us 15 hours per week on billing and GST compliance. The AI bill scanner is incredibly accurate.',
        rating: 5,
        initials: 'RG',
        color: 'bg-[#10a24b]/10 text-[#10a24b]',
    },
    {
        name: 'Priya Sharma',
        role: 'CA, Sharma & Associates',
        quote: 'Managing GST for multiple clients used to be a nightmare. With GSTFlow, I handle 3x more clients with zero errors.',
        rating: 5,
        initials: 'PS',
        color: 'bg-blue-100 text-blue-600',
    },
    {
        name: 'Vikram Patel',
        role: 'Director, Patel Exports',
        quote: 'The IGST automation for inter-state transactions alone is worth the subscription. Filing returns is now one-click.',
        rating: 5,
        initials: 'VP',
        color: 'bg-amber-100 text-amber-600',
    },
    {
        name: 'Anita Desai',
        role: 'Founder, Urban Kitchen',
        quote: 'As a small restaurant owner, I never understood GST. GSTFlow handles everything automatically and I love the insights.',
        rating: 5,
        initials: 'AD',
        color: 'bg-violet-100 text-violet-600',
    },
];

export default function TestimonialsSection() {
    return (
        <section id="testimonials" className="py-24 bg-white relative">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-80px' }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 text-violet-600 text-xs font-semibold mb-4 border border-violet-100">
                        <span className="material-symbols-outlined text-sm">diversity_3</span>
                        Trusted by Businesses
                    </div>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                        Loved by 10,000+ Indian businesses
                    </h2>
                    <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                        See what business owners and accountants say about GSTFlow.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {TESTIMONIALS.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.4 }}
                            className="p-6 rounded-2xl border border-slate-100 hover:border-[#10a24b]/20 bg-white hover:shadow-md transition-all duration-300"
                        >
                            <div className="flex gap-1 mb-4">
                                {Array.from({ length: t.rating }).map((_, j) => (
                                    <Star key={j} size={14} className="text-amber-400 fill-amber-400" />
                                ))}
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">
                                &ldquo;{t.quote}&rdquo;
                            </p>

                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-sm font-bold`}>
                                    {t.initials}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                                    <p className="text-xs text-slate-500">{t.role}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
