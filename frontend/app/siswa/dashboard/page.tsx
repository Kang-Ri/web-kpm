'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Home, BookOpen, Trophy, Info, Menu, X, LogOut, Loader2, Calendar } from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ProfileCompletionModal } from '@/components/siswa/ProfileCompletionModal';
import { RuangKelasModal } from '@/components/siswa/RuangKelasModal';
import { siswaService } from '@/lib/api/siswa.service';

const menuItems = [
    { label: 'Home', icon: Home, href: '/siswa/dashboard' },
    { label: 'Kelas', icon: BookOpen, href: '/siswa/kelas' },
    { label: 'Suprarasional', icon: Trophy, href: '/siswa/suprarasional' },
    { label: 'Info Lomba', icon: Info, href: '/siswa/info-lomba' },
];

interface EnrollmentDashboardData {
    siswa: {
        idSiswa: number;
        namaLengkap: string;
        jenjangKelas?: string;
        email?: string;
    };
    needsProfileCompletion: boolean;
    sections: {
        kelasPeriodik: any[];
        kelasInsidental: any[];
        produkKomersial: any[];
    };
}

export default function SiswaDashboardPage() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Enrollment state
    const [dashboardData, setDashboardData] = useState<EnrollmentDashboardData | null>(null);
    const [myClasses, setMyClasses] = useState<any[]>([]);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ruang Kelas Modal state
    const [showRuangKelasModal, setShowRuangKelasModal] = useState(false);
    const [selectedParent1, setSelectedParent1] = useState<{ id: number; nama: string } | null>(null);

    // Fetch dashboard data (reusable)
    const fetchDashboardData = useCallback(async () => {
        if (!user?.idSiswa) return;

        try {
            setIsLoading(true);
            console.log('🚀 DASHBOARD: Fetching sections & status...');

            // 1. Fetch public sections
            const response = await (async () => {
                // To avoid fetchSections duplication, I'll just use the service directly
                return await siswaService.getParent1Sections();
            })();

            // 2. Fetch student status
            const statusResponse = await siswaService.getEnrollmentDashboard(user.idSiswa);
            const needsProfile = statusResponse.data.data.needsProfileCompletion;
            const siswaData = statusResponse.data.data.siswa || {
                idSiswa: user.idSiswa,
                namaLengkap: user.namaLengkap || 'User',
                email: user.email
            };

            // 3. Fetch My Enrolled Classes
            const myClassesResp = await siswaService.getMyClasses(user.idSiswa);
            setMyClasses(myClassesResp.data.data);

            setDashboardData({
                siswa: siswaData,
                needsProfileCompletion: needsProfile,
                sections: response.data.data
            });
        } catch (error: any) {
            console.error('❌ DASHBOARD: Error fetching sections:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleProfileComplete = async (data: any) => {
        if (!user?.idSiswa) return;

        try {
            setIsSubmitting(true);
            await siswaService.completeProfile(user.idSiswa, data);

            // Reload dashboard data
            const response = await siswaService.getEnrollmentDashboard(user.idSiswa);
            setDashboardData(response.data.data); // FIXED: response.data.data
            setShowProfileModal(false);
        } catch (error: any) {
            console.error('Error completing profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleParent1Click = (idParent1: number, namaParent1: string) => {
        if (dashboardData?.needsProfileCompletion) {
            setShowProfileModal(true);
        } else {
            setSelectedParent1({ id: idParent1, nama: namaParent1 });
            setShowRuangKelasModal(true);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    // Calculate stats
    const totalKelas = dashboardData?.sections
        ? dashboardData.sections.kelasPeriodik.length + dashboardData.sections.kelasInsidental.length
        : 0;

    const totalMateri = dashboardData?.sections
        ? dashboardData.sections.kelasPeriodik.reduce((sum, p1) => sum + (p1.jumlahRuangKelas || 0), 0) +
        dashboardData.sections.kelasInsidental.reduce((sum, p1) => sum + (p1.jumlahRuangKelas || 0), 0)
        : 0;

    return (
        <ProtectedRoute allowedRoles={['Siswa']}>
            <div className="min-h-screen bg-gray-50 flex">
                {/* Profile Completion Modal */}
                {showProfileModal && dashboardData && (
                    <ProfileCompletionModal
                        isOpen={showProfileModal}
                        siswaName={dashboardData.siswa.namaLengkap}
                        initialData={dashboardData.siswa}
                        onComplete={handleProfileComplete}
                        isLoading={isSubmitting}
                    />
                )}

                {/* Ruang Kelas Modal */}
                {showRuangKelasModal && selectedParent1 && user?.idSiswa && (
                    <RuangKelasModal
                        isOpen={showRuangKelasModal}
                        onClose={() => setShowRuangKelasModal(false)}
                        idSiswa={user.idSiswa}
                        idParent1={selectedParent1.id}
                        namaParent1={selectedParent1.nama}
                        onSuccess={fetchDashboardData}
                    />
                )}

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
                            const isActive = false;
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
                        {/* Loading State */}
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <>
                                {/* Welcome Card */}
                                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white mb-6">
                                    <h2 className="text-2xl font-bold mb-2">
                                        Selamat Datang, {user?.namaLengkap?.split(' ')[0] || 'Siswa'}! 👋
                                    </h2>
                                    <p className="text-blue-100">
                                        Semangat belajar! Akses materi dan informasi terbaru di sini.
                                    </p>
                                    {dashboardData?.siswa.jenjangKelas && (
                                        <p className="text-sm text-blue-200 mt-2">
                                            📚 Kelas {dashboardData.siswa.jenjangKelas}
                                        </p>
                                    )}
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Kelas Tersedia</p>
                                                <p className="text-2xl font-bold text-gray-900">{totalKelas}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-blue-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Ruang Kelas</p>
                                                <p className="text-2xl font-bold text-gray-900">{totalMateri}</p>
                                            </div>
                                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-green-600" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600 mb-1">Produk</p>
                                                <p className="text-2xl font-bold text-gray-900">
                                                    {dashboardData?.sections.produkKomersial.length || 0}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                                <Trophy className="w-6 h-6 text-yellow-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* My Active Classes (QUICK ACCESS) */}
                                {myClasses.length > 0 && (
                                    <div className="mb-8">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                                                <Trophy className="w-6 h-6 text-yellow-500" />
                                                Kelas Saya
                                            </h3>
                                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                                {myClasses.length} Kelas Aktif
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {myClasses.map((item) => {
                                                const kelas = item.parentProduct2;
                                                return (
                                                    <button
                                                        key={kelas.idParent2}
                                                        onClick={() => router.push(`/siswa/kelas/${kelas.idParent2}`)}
                                                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-xl hover:border-blue-500/50 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                                                    >
                                                        {/* Decorative Background */}
                                                        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-blue-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-500"></div>
                                                        
                                                        <div className="relative">
                                                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform">
                                                                <BookOpen className="w-6 h-6" />
                                                            </div>
                                                            <h4 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2 text-lg leading-tight">
                                                                {kelas.namaParent2}
                                                            </h4>
                                                            <p className="text-sm text-gray-500 mb-4 line-clamp-2 leading-relaxed">
                                                                {kelas.descParent2 || 'Akses materi belajar dan informasi kelas Anda di sini.'}
                                                            </p>
                                                            
                                                            <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                    <Calendar className="w-3.5 h-3.5" />
                                                                    {kelas.tahunAjaran || '2023/2024'}
                                                                </div>
                                                                <span className="text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                                                    Masuk <span className="text-lg">→</span>
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Enrollment Sections */}
                                {dashboardData && (
                                    <>
                                        {/* Kelas Periodik */}
                                        {dashboardData.sections.kelasPeriodik.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">📚 Kelas Periodik</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {dashboardData.sections.kelasPeriodik.map((parent1) => (
                                                        <button
                                                            key={parent1.idParent1}
                                                            onClick={() => handleParent1Click(parent1.idParent1, parent1.namaParent1)}
                                                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
                                                        >
                                                            <h4 className="font-semibold text-gray-900 mb-2">{parent1.namaParent1}</h4>
                                                            {parent1.descParent1 && (
                                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{parent1.descParent1}</p>
                                                            )}
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-500">{parent1.jumlahRuangKelas} Ruang Kelas</span>
                                                                <span className="text-blue-600 font-medium">Lihat →</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Kelas Insidental */}
                                        {dashboardData.sections.kelasInsidental.length > 0 && (
                                            <div className="mb-6">
                                                <h3 className="text-lg font-bold text-gray-900 mb-4">⚡ Kelas Insidental</h3>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {dashboardData.sections.kelasInsidental.map((parent1) => (
                                                        <button
                                                            key={parent1.idParent1}
                                                            onClick={() => handleParent1Click(parent1.idParent1, parent1.namaParent1)}
                                                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-shadow"
                                                        >
                                                            <h4 className="font-semibold text-gray-900 mb-2">{parent1.namaParent1}</h4>
                                                            {parent1.descParent1 && (
                                                                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{parent1.descParent1}</p>
                                                            )}
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-500">{parent1.jumlahRuangKelas} Ruang Kelas</span>
                                                                <span className="text-blue-600 font-medium">Lihat →</span>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Empty State */}
                                        {totalKelas === 0 && (
                                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                                                <Info className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                                                <h3 className="font-semibold text-gray-900 mb-1">Belum Ada Kelas Tersedia</h3>
                                                <p className="text-sm text-gray-600">
                                                    Kelas untuk jenjang {dashboardData.siswa.jenjangKelas} belum tersedia.
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
