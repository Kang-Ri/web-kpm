'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const router = useRouter();
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const user = useAuthStore((state) => state.user);
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        // Check if not authenticated
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }

        // Check if role is allowed
        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            // Redirect to appropriate dashboard based on role
            if (user.role === 'Siswa') {
                router.push('/siswa/dashboard');
            } else {
                router.push('/admin/dashboard');
            }
            return;
        }

        // Auth check passed
        setIsChecking(false);
    }, [isAuthenticated, user, allowedRoles, router]);

    // Show loading while checking auth
    if (isChecking || !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memverifikasi akses...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
