'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) return;

    if (isAuthenticated && user) {
      // Redirect based on role
      setHasRedirected(true);
      if (user.role === 'Siswa') {
        router.push('/siswa/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    } else {
      // Redirect to login
      setHasRedirected(true);
      router.push('/login');
    }
  }, [isAuthenticated, user, router, hasRedirected]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Loading...</p>
      </div>
    </div>
  );
}
