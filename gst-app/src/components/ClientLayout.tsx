'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/api';
import AppShell from '@/components/AppShell';

// Public routes that don't need authentication or AppShell
const PUBLIC_ROUTES = [
    '/', '/auth/login', '/auth/signup', '/auth/reset-password',
    // Footer — Product
    '/features', '/pricing', '/integrations', '/api-docs',
    // Footer — Company
    '/about', '/blog', '/careers', '/contact',
    // Footer — Legal
    '/privacy-policy', '/terms-of-service', '/cookie-policy',
    // Footer — Support
    '/help-center', '/community', '/status',
];

function isPublicRoute(pathname: string) {
    return PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/auth/') || pathname.startsWith('/blog/');
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [checked, setChecked] = useState(false);
    const [authed, setAuthed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const isPublic = isPublicRoute(pathname);

    useEffect(() => {
        const loggedIn = isLoggedIn();
        setAuthed(loggedIn);
        setChecked(true);

        // Redirect authenticated users away from auth pages to dashboard
        if (loggedIn && pathname.startsWith('/auth/')) {
            router.replace('/dashboard');
        }

        // Redirect unauthenticated users from protected routes to login
        if (!loggedIn && !isPublic) {
            router.replace('/auth/login');
        }
    }, [pathname, router, isPublic]);

    // Still checking auth state
    if (!checked) return null;

    // Public pages — render directly without AppShell
    if (isPublic) {
        return <>{children}</>;
    }

    // Protected route but not authenticated
    if (!authed) return null;

    // Authenticated protected route — wrap in AppShell
    return <AppShell>{children}</AppShell>;
}
