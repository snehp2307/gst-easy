'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect old /auth route to /auth/login
export default function AuthRedirect() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/auth/login');
    }, [router]);
    return null;
}
