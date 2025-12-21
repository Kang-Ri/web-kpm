'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/lib/store/authStore';
import { authService } from '@/lib/api/auth.service';

const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const setAuth = useAuthStore((state) => state.setAuth);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError('');

            console.log('🔐 LOGIN: Starting login...');
            const response = await authService.login(data);
            console.log('✅ LOGIN: API Response:', response.data);

            // Save to store
            console.log('💾 LOGIN: Saving auth state...');
            console.log('User:', response.data.user);
            console.log('AccessToken:', response.data.accessToken);
            console.log('RefreshToken:', response.data.refreshToken);

            setAuth(
                response.data.user,
                response.data.accessToken,
                response.data.refreshToken
            );

            console.log('✅ LOGIN: Auth state saved!');

            // Redirect based on role
            if (response.data.user.role === 'Siswa') {
                console.log('🚀 LOGIN: Redirecting to /siswa/dashboard');
                router.push('/siswa/dashboard');
            } else {
                console.log('🚀 LOGIN: Redirecting to /admin/dashboard');
                router.push('/admin/dashboard');
            }
        } catch (err: any) {
            console.error('❌ LOGIN ERROR:', err);
            setError(err.message || 'Login gagal. Periksa email dan password Anda.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-blue opacity-10"></div>

            {/* Login Card */}
            <div className="relative w-full max-w-md">
                <div className="card shadow-strong">
                    {/* Header with Gradient */}
                    <div className="bg-gradient-blue text-white px-8 py-10 rounded-t-lg text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogIn className="h-8 w-8" />
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Web KPM</h1>
                        <p className="text-white/90 text-sm">Learning Management System</p>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <h2 className="text-xl font-semibold text-dark-900 mb-6">
                            Masuk ke Akun Anda
                        </h2>

                        {error && (
                            <div className="mb-6 px-4 py-3 bg-danger-50 border border-danger-200 rounded-md flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-danger-800">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-dark-700 mb-2">
                                    Email
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        {...register('email')}
                                        type="email"
                                        id="email"
                                        className={`input pl-10 ${errors.email ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                                        placeholder="nama@email.com"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-dark-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        {...register('password')}
                                        type="password"
                                        id="password"
                                        className={`input pl-10 ${errors.password ? 'border-danger-500 focus:ring-danger-500' : ''}`}
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
                                )}
                            </div>

                            {/* Remember Me & Forgot Password */}
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-dark-600">Ingat saya</span>
                                </label>
                                <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                                    Lupa password?
                                </a>
                            </div>

                            {/* Submit Button */}
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                className="w-full"
                                isLoading={isLoading}
                                icon={!isLoading ? LogIn : undefined}
                            >
                                {isLoading ? 'Memproses...' : 'Masuk'}
                            </Button>
                        </form>

                        {/* Footer */}
                        <div className="mt-6 text-center">
                            <p className="text-sm text-dark-600">
                                Belum punya akun?{' '}
                                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Daftar sekarang
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Note */}
                <p className="text-center text-sm text-dark-500 mt-6">
                    © 2025 Web KPM. All rights reserved.
                </p>
            </div>
        </div>
    );
}
