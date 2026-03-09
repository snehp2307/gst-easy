'use client';

import Link from 'next/link';
import FooterSection from '@/components/landing/FooterSection';

/**
 * Shared wrapper for public (non-app) pages like footer links.
 * Renders a simple navbar + content + footer.
 */
export default function PublicPageLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-white">
            {/* Navbar */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 no-underline">
                        <div className="w-9 h-9 bg-[#10a24b] rounded-lg flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                        </div>
                        <span className="text-lg font-bold text-slate-900 tracking-tight">GSTFlow</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-[#10a24b] transition-colors no-underline">Login</Link>
                        <Link href="/auth/signup" className="bg-[#10a24b] hover:bg-[#10a24b]/90 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors no-underline">Get Started</Link>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <FooterSection />
        </div>
    );
}
