'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, Settings, LogOut, Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';

interface TopbarProps {
    onMenuClick?: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <header className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    {/* Left: Menu Button (Mobile) + Logo */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onMenuClick}
                            className="lg:hidden p-2 hover:bg-white/10 rounded-md transition"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <a href="/" className="flex items-center gap-2">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center font-bold text-xl">
                                K
                            </div>
                            <span className="text-xl font-bold hidden sm:block">Web KPM</span>
                        </a>
                    </div>

                    {/* Center: Search Bar */}
                    <div className="hidden md:flex flex-1 max-w-xl mx-8">
                        <div className="relative w-full">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-white/60" />
                            </div>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                                placeholder="Cari kelas, produk, atau materi..."
                                suppressHydrationWarning
                            />
                        </div>
                    </div>

                    {/* Right: Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-3 p-2 hover:bg-white/10 rounded-lg transition"
                        >
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-medium">{user?.namaLengkap || 'User'}</p>
                                <p className="text-xs text-white/80">{user?.role || 'Role'}</p>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                {user?.foto ? (
                                    <img src={user.foto} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <User className="h-5 w-5" />
                                )}
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {showProfileMenu && (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setShowProfileMenu(false)}
                                />

                                {/* Menu */}
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-1 z-20">
                                    <a
                                        href="/profile"
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <User className="h-5 w-5 text-gray-500" />
                                        <span>Informasi Akun</span>
                                    </a>
                                    <a
                                        href="/settings"
                                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                                    >
                                        <Settings className="h-5 w-5 text-gray-500" />
                                        <span>Pengaturan</span>
                                    </a>
                                    <hr className="my-1" />
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition"
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>Logout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
