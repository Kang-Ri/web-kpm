'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, BookOpen, Trophy, Info, Menu, X, LogOut } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const menuItems = [
    { label: 'Home', icon: Home, href: '/siswa/dashboard' },
    { label: 'Kelas', icon: BookOpen, href: '/siswa/kelas' },
    { label: 'Suprarasional', icon: Trophy, href: '/siswa/suprarasional' },
    { label: 'Info Lomba', icon: Info, href: '/siswa/info-lomba' },
];

export default function SiswaDashboardPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <ProtectedRoute allowedRoles={['Siswa']}>
            <div className="min-h-screen bg-gray-50 flex">
                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Sidebar */}
                <aside
                    className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                        } lg:translate-x-0`}
                >
                    {/* Sidebar Header */}
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                                KPM
                            </div>
                            <span className="font-bold text-gray-900">Web KPM</span>
                        </div>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* User Info */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                {user?.namaLengkap?.charAt(0) || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {user?.namaLengkap || 'Siswa'}
                                </p>
                                <p className="text-xs text-gray-500">Siswa</p>
                            </div>
                        </div>
                    </div>

                    {/* Menu Items */}
                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = false; // TODO: Check active route
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Logout Button */}
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Keluar</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Top Bar */}
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700 mr-4"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                    </header>

                    {/* Page Content */}
                    <main className="flex-1 p-6 overflow-auto">
                        {/* Welcome Card */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
                            <h2 className="text-2xl font-bold mb-2">
                                Selamat Datang, {user?.namaLengkap?.split(' ')[0] || 'Siswa'}! 👋
                            </h2>
                            <p className="text-blue-100">
                                Semangat belajar! Akses materi dan informasi terbaru di sini.
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Kelas Aktif</p>
                                        <p className="text-2xl font-bold text-gray-900">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Materi</p>
                                        <p className="text-2xl font-bold text-gray-900">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                        <BookOpen className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Lomba Aktif</p>
                                        <p className="text-2xl font-bold text-gray-900">0</p>
                                    </div>
                                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                        <Trophy className="w-6 h-6 text-yellow-600" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Aktivitas Terbaru</h3>
                            <div className="text-center py-8 text-gray-500">
                                <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                <p>Belum ada aktivitas</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
