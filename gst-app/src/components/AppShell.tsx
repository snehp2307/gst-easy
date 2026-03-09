'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/api';

const NAV_ITEMS = [
    { icon: 'dashboard', label: 'Dashboard', href: '/dashboard' },
    { icon: 'description', label: 'Invoices', href: '/invoices' },
    { icon: 'receipt_long', label: 'Bills', href: '/bills' },
    { icon: 'payments', label: 'Payments', href: '/payments' },
    { icon: 'percent', label: 'GST Center', href: '/gst-center' },
    { icon: 'bar_chart', label: 'Reports', href: '/reports' },
    { divider: true },
    { icon: 'group', label: 'Customers', href: '/customers' },
    { icon: 'storefront', label: 'Vendors', href: '/vendors' },
    { icon: 'inventory_2', label: 'Products', href: '/products' },
    { divider: true },
    { icon: 'upload_file', label: 'Documents', href: '/documents' },
    { icon: 'auto_awesome', label: 'AI Assistant', href: '/ai' },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const user = getCurrentUser();

    return (
        <div className="flex min-h-screen overflow-x-hidden bg-[#f6f8f7]">
            {/* Sidebar */}
            <aside className="w-64 min-w-[256px] border-r border-slate-200 bg-white flex flex-col h-screen sticky top-0 max-md:hidden">
                {/* Brand */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#10a24b] rounded-lg flex items-center justify-center text-white">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">GSTFlow</h1>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">Automation Platform</p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map((item, i) => {
                        if ('divider' in item) {
                            return <div key={`d-${i}`} className="my-3 border-t border-slate-100" />;
                        }
                        const isActive = item.href === '/dashboard'
                            ? pathname === '/dashboard'
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${isActive
                                        ? 'bg-[#10a24b]/10 text-[#10a24b]'
                                        : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-[22px] ${isActive ? 'text-[#10a24b]' : 'text-slate-400'}`}>
                                    {item.icon}
                                </span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Settings + User */}
                <div className="p-4 border-t border-slate-200">
                    <Link
                        href="/settings"
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${pathname === '/settings'
                                ? 'bg-[#10a24b]/10 text-[#10a24b]'
                                : 'text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[22px] text-slate-400">settings</span>
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top Header */}
                <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex-1 max-w-xl">
                        <div className="relative group">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#10a24b] transition-colors">search</span>
                            <input
                                type="text"
                                placeholder="Search invoices, customers, or reports..."
                                className="w-full bg-slate-50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#10a24b]/20 transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4 ml-8">
                        <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                        </button>

                        <div className="h-8 w-px bg-slate-200" />

                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-900">{user?.name || 'User'}</p>
                                <p className="text-xs text-slate-500">Administrator</p>
                            </div>
                            <div
                                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#10a24b] to-emerald-600 flex items-center justify-center text-white text-sm font-bold cursor-pointer ring-2 ring-[#10a24b]/10"
                                onClick={() => { logout(); window.location.href = '/auth/login'; }}
                                title="Logout"
                            >
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-8 flex-1">
                    {children}
                </main>
            </div>
        </div>
    );
}
