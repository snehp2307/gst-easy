'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout } from '@/lib/api';

const NAV_ITEMS = [
    { icon: 'dashboard', label: 'Dashboard', href: '/' },
    { icon: 'description', label: 'Invoices', href: '/invoices' },
    { icon: 'receipt_long', label: 'Bills', href: '/bills' },
    { icon: 'payments', label: 'Payments', href: '/payments' },
    { icon: 'gavel', label: 'GST Center', href: '/gst-center' },
    { icon: 'bar_chart', label: 'Reports', href: '/reports' },
    { divider: true },
    { icon: 'group', label: 'Customers', href: '/customers' },
    { icon: 'store', label: 'Vendors', href: '/vendors' },
] as const;

export default function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname === '/auth';
    const user = getCurrentUser();

    if (isAuthPage) return <>{children}</>;

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* Sidebar */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <div className="sidebar-brand-icon">
                        <span className="material-symbols-outlined">account_balance_wallet</span>
                    </div>
                    <div>
                        <h1>GSTFlow</h1>
                        <p>Automation Platform</p>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item, i) => {
                        if ('divider' in item) {
                            return <div key={i} className="sidebar-divider" />;
                        }
                        const isActive = item.href === '/'
                            ? pathname === '/'
                            : pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={isActive ? 'active' : ''}
                            >
                                <span className="material-symbols-outlined">{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="sidebar-footer">
                    <Link href="/settings" className={pathname === '/settings' ? 'active' : ''} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                        borderRadius: '8px', fontSize: '14px', fontWeight: 500, color: '#475569',
                        textDecoration: 'none',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '22px', color: '#94a3b8' }}>settings</span>
                        <span>Settings</span>
                    </Link>
                </div>
            </aside>

            {/* Main Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Top Header */}
                <header className="top-header">
                    <div className="search-box">
                        <span className="material-symbols-outlined">search</span>
                        <input type="text" placeholder="Search invoices, customers, or reports..." />
                    </div>
                    <div className="header-actions">
                        <button className="notification-btn">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="notification-dot" />
                        </button>
                        <div style={{ height: '32px', width: '1px', background: '#e2e8f0' }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>
                                    {user?.name || 'User'}
                                </p>
                                <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                                    Administrator
                                </p>
                            </div>
                            <div
                                className="user-avatar"
                                onClick={() => { logout(); window.location.href = '/auth'; }}
                                title="Logout"
                            >
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-content animate-fadeIn">
                    {children}
                </main>
            </div>
        </div>
    );
}
