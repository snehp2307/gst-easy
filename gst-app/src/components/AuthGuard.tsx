'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/api';

/**
 * AuthGuard — wraps the main app layout.
 * Redirects to /auth if user is not logged in.
 * Shows nothing while checking auth state (prevents flash).
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const [checked, setChecked] = useState(false);
    const [authed, setAuthed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const loggedIn = isLoggedIn();
        setAuthed(loggedIn);
        setChecked(true);

        // Redirect unauthenticated users to /auth
        if (!loggedIn && pathname !== '/auth') {
            router.replace('/auth');
        }
        // Redirect authenticated users away from /auth
        if (loggedIn && pathname === '/auth') {
            router.replace('/');
        }
    }, [pathname, router]);

    // Still checking — show nothing to prevent flash
    if (!checked) {
        return null;
    }

    // On the auth page — always render (no header/nav)
    if (pathname === '/auth') {
        return <>{children}</>;
    }

    // Not authenticated — don't render protected content
    if (!authed) {
        return null;
    }

    // Authenticated — render everything
    return <>{children}</>;
}
