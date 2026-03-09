'use client';

import Link from 'next/link';

const FOOTER_LINKS = {
    Product: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
        { label: 'Integrations', href: '/integrations' },
        { label: 'API Docs', href: '/api-docs' },
    ],
    Company: [
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'Careers', href: '/careers' },
        { label: 'Contact', href: '/contact' },
    ],
    Legal: [
        { label: 'Privacy Policy', href: '/privacy-policy' },
        { label: 'Terms of Service', href: '/terms-of-service' },
        { label: 'Cookie Policy', href: '/cookie-policy' },
    ],
    Support: [
        { label: 'Help Center', href: '/help-center' },
        { label: 'Community', href: '/community' },
        { label: 'Status', href: '/status' },
    ],
};

const SOCIAL_LINKS = [
    { label: 'GitHub', icon: 'code', href: 'https://github.com/gstflow' },
    { label: 'LinkedIn', icon: 'work', href: 'https://linkedin.com/company/gstflow' },
    { label: 'Email', icon: 'mail', href: 'mailto:support@gstflow.in' },
];

export default function FooterSection() {
    return (
        <footer className="bg-slate-900 text-slate-300 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand Column */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2.5 mb-4 no-underline">
                            <div className="w-9 h-9 bg-[#10a24b] rounded-lg flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                            </div>
                            <span className="text-lg font-bold text-white tracking-tight">GSTFlow</span>
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed mb-4">
                            AI-powered GST automation for Indian businesses. Simplify compliance, maximize savings.
                        </p>
                        <div className="flex gap-3">
                            {SOCIAL_LINKS.map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-[#10a24b]/20 flex items-center justify-center transition-colors"
                                    title={s.label}
                                >
                                    <span className="material-symbols-outlined text-slate-400 hover:text-[#10a24b] text-base">
                                        {s.icon}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Link Columns */}
                    {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                        <div key={title}>
                            <h4 className="text-white text-sm font-bold mb-4">{title}</h4>
                            <ul className="space-y-2.5">
                                {links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-400 hover:text-[#10a24b] transition-colors no-underline"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} GSTFlow Automation Platform. All rights reserved.
                    </p>
                    <p className="text-xs text-slate-500">
                        Made with ❤️ in India. All financial data is encrypted and secure.
                    </p>
                </div>
            </div>
        </footer>
    );
}
