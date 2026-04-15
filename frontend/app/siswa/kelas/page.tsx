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

export default function SiswaKelasPage() {
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

    const fetchData = useCallback(async () => {
        if (!user?.idSiswa) return;

        try {
            setIsLoading(true);
            
            // 1. Fetch Categories for exploration
            const sectionsResp = await siswaService.getParent1Sections();
            
            // 2. Fetch student status
            const statusResp = await siswaService.getEnrollmentDashboard(user.idSiswa);
            
            // 3. Fetch Enrolled Classes
            const myClassesResp = await siswaService.getMyClasses(user.idSiswa);
            
            setMyClasses(myClassesResp.data.data);
            setDashboardData({
                siswa: statusResp.data.data.siswa || {
                    idSiswa: user.idSiswa,
                    namaLengkap: user.namaLengkap || 'Siswa',
                    email: user.email
                },
                needsProfileCompletion: statusResp.data.data.needsProfileCompletion,
                sections: sectionsResp.data.data
            });
        } catch (error) {
            console.error('Error fetching class data:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleParent1Click = (idParent1: number, namaParent1: string) => {
        if (dashboardData?.needsProfileCompletion) {
            setShowProfileModal(true);
        } else {
            setSelectedParent1({ id: idParent1, nama: namaParent1 });
            setShowRuangKelasModal(true);
        }
    };

    const handleProfileComplete = async (data: any) => {
        if (!user?.idSiswa) return;
        try {
            setIsSubmitting(true);
            await siswaService.completeProfile(user.idSiswa, data);
            await fetchData();
            setShowProfileModal(false);
        } catch (error) {
            console.error('Error completing profile:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <ProtectedRoute allowedRoles={['Siswa']}>
            <div className="min-h-screen bg-gray-50 flex">
                {/* Modals */}
                {showProfileModal && dashboardData && (
                    <ProfileCompletionModal
                        isOpen={showProfileModal}
                        siswaName={dashboardData.siswa.namaLengkap}
                        initialData={dashboardData.siswa}
                        onComplete={handleProfileComplete}
                        isLoading={isSubmitting}
                    />
                )}
                {showRuangKelasModal && selectedParent1 && user?.idSiswa && (
                    <RuangKelasModal
                        isOpen={showRuangKelasModal}
                        onClose={() => setShowRuangKelasModal(false)}
                        idSiswa={user.idSiswa}
                        idParent1={selectedParent1.id}
                        namaParent1={selectedParent1.nama}
                        onSuccess={fetchData}
                    />
                )}

                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
                )}

                {/* Sidebar */}
                <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">KPM</div>
                            <span className="font-bold text-gray-900">Web KPM</span>
                        </div>
                        <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-500"><X className="w-5 h-5" /></button>
                    </div>

                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                                {user?.namaLengkap?.charAt(0) || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{user?.namaLengkap || 'Siswa'}</p>
                                <p className="text-xs text-gray-500">Siswa</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 px-4 py-4 space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.href === '/siswa/kelas';
                            return (
                                <button
                                    key={item.href}
                                    onClick={() => router.push(item.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>

                    <div className="p-4 border-t border-gray-200">
                        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition">
                            <LogOut className="w-5 h-5" />
                            <span className="font-medium">Keluar</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0">
                    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500 mr-4"><Menu className="w-6 h-6" /></button>
                        <h1 className="text-xl font-bold text-gray-900">Manajemen Kelas</h1>
                    </header>

                    <main className="flex-1 p-6 overflow-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
                        ) : (
                            <div className="max-w-7xl mx-auto space-y-10">
                                {/* SECTION: Kelas Saya */}
                                <section>
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                            <Trophy className="w-7 h-7 text-yellow-500" />
                                            Kelas Saya
                                        </h2>
                                        <span className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                                            {myClasses.length} Kelas Aktif
                                        </span>
                                    </div>

                                    {myClasses.length === 0 ? (
                                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">Belum Ada Kelas</h3>
                                            <p className="text-gray-500 max-w-sm mx-auto">Anda belum terdaftar di kelas manapun. Silakan pilih kelas di bawah untuk mulai belajar.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {myClasses.map((item) => {
                                                const kelas = item.parentProduct2;
                                                return (
                                                    <div 
                                                        key={kelas.idParent2}
                                                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-blue-500/30 transition-all duration-300"
                                                    >
                                                        <div className="p-6">
                                                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mb-5">
                                                                <BookOpen className="w-6 h-6" />
                                                            </div>
                                                            <h3 className="font-bold text-gray-900 text-lg mb-2 leading-tight">{kelas.namaParent2}</h3>
                                                            <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed h-10">
                                                                {kelas.descParent2 || 'Akses materi belajar dan informasi kelas Anda di sini.'}
                                                            </p>
                                                            
                                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                                                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                                                                    <Calendar className="w-4 h-4" />
                                                                    {kelas.tahunAjaran || '2023/2024'}
                                                                </div>
                                                                <button 
                                                                    onClick={() => router.push(`/siswa/kelas/${kelas.idParent2}`)}
                                                                    className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition transform hover:scale-105 active:scale-95 shadow-md shadow-blue-200"
                                                                >
                                                                    Masuk Kelas
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </section>

                                {/* SECTION: Eksplorasi Kelas */}
                                {dashboardData && (
                                    <section className="pt-8 border-t border-gray-200">
                                        <div className="mb-8">
                                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Eksplorasi Kelas Baru</h2>
                                            <p className="text-gray-600">Daftar kelas baru untuk meningkatkan kemampuan matematika Anda.</p>
                                        </div>

                                        <div className="space-y-12">
                                            {/* Kelas Periodik */}
                                            {dashboardData.sections.kelasPeriodik.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-blue-800 bg-blue-50/50 px-4 py-2 rounded-lg inline-block mb-6">📚 KELAS PERIODIK</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {dashboardData.sections.kelasPeriodik.map((p1) => (
                                                            <button
                                                                key={p1.idParent1}
                                                                onClick={() => handleParent1Click(p1.idParent1, p1.namaParent1)}
                                                                className="group bg-white rounded-2xl border border-gray-200 p-6 text-left hover:border-blue-500 hover:shadow-lg transition-all"
                                                            >
                                                                <h4 className="font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">{p1.namaParent1}</h4>
                                                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{p1.descParent1 || 'Program pengembangan kemampuan matematika secara rutin.'}</p>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-xs font-semibold text-gray-400">{p1.jumlahRuangKelas} Ruang Kelas</span>
                                                                    <span className="text-sm font-bold text-blue-600 group-hover:translate-x-1 transition-transform">Daftar →</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Kelas Insidental */}
                                            {dashboardData.sections.kelasInsidental.length > 0 && (
                                                <div>
                                                    <h3 className="text-lg font-extrabold text-orange-800 bg-orange-50/50 px-4 py-2 rounded-lg inline-block mb-6">⚡ KELAS INSIDENTAL</h3>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                        {dashboardData.sections.kelasInsidental.map((p1) => (
                                                            <button
                                                                key={p1.idParent1}
                                                                onClick={() => handleParent1Click(p1.idParent1, p1.namaParent1)}
                                                                className="group bg-white rounded-2xl border border-gray-200 p-6 text-left hover:border-orange-500 hover:shadow-lg transition-all"
                                                            >
                                                                <h4 className="font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">{p1.namaParent1}</h4>
                                                                <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10">{p1.descParent1 || 'Program belajar untuk persiapan lomba atau event tertentu.'}</p>
                                                                <div className="flex items-center justify-between mt-2">
                                                                    <span className="text-xs font-semibold text-gray-400">{p1.jumlahRuangKelas} Ruang Kelas</span>
                                                                    <span className="text-sm font-bold text-orange-600 group-hover:translate-x-1 transition-transform">Daftar →</span>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
