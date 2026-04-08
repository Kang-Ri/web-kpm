'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ArrowLeft, 
    Play, 
    FileText, 
    Download, 
    CheckCircle, 
    Clock,
    BookOpen,
    Loader2,
    Video,
    Search
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { siswaService } from '@/lib/api/siswa.service';
import { toast } from 'react-hot-toast';

export default function SiswaKelasDetailPage() {
    const params = useParams();
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const idParent2 = parseInt(params.idParent2 as string);

    const [classroom, setClassroom] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (user?.idSiswa && idParent2) {
            fetchClassroomContent();
        }
    }, [user, idParent2]);

    const fetchClassroomContent = async () => {
        try {
            setIsLoading(true);
            const response = await siswaService.getClassroomContent(user!.idSiswa, idParent2);
            setClassroom(response.data.data);
            
            // Auto-select first video if available
            const firstVideo = response.data.data.products?.find((p: any) => 
                p.buttons?.some((b: any) => b.tipeButton === 'Video')
            );
            if (firstVideo) {
                const videoBtn = firstVideo.buttons.find((b: any) => b.tipeButton === 'Video');
                if (videoBtn) setSelectedVideo(videoBtn.urlLink);
            }

        } catch (error: any) {
            console.error('Error fetching classroom content:', error);
            const message = error.response?.data?.message || 'Gagal memuat materi kelas';
            toast.error(message);
            if (error.response?.status === 400 || error.response?.status === 403) {
                router.push('/siswa/dashboard');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const filteredMaterials = classroom?.products?.filter((p: any) => 
        p.namaProduk.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descProduk?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Menyiapkan Ruang Belajar...</p>
                </div>
            </div>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['Siswa']}>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => router.push('/siswa/dashboard')}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-xl font-extrabold text-gray-900 truncate max-w-[200px] md:max-w-2xl flex items-center gap-2">
                                    <span className="bg-blue-600 w-1.5 h-6 rounded-full hidden md:block"></span>
                                    {classroom?.namaParent2}
                                </h1>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider">{classroom?.tahunAjaran}</p>
                                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold">MODE BELAJAR</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Terdaftar & Aktif
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Video Player & Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player */}
                        <div className="bg-black rounded-2xl overflow-hidden shadow-2xl aspect-video relative group border border-gray-100">
                            {selectedVideo ? (
                                <iframe
                                    src={`https://www.youtube.com/embed/${getYouTubeId(selectedVideo)}?autoplay=0&rel=0&modestbranding=1`}
                                    className="w-full h-full"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-slate-900">
                                    <Video className="w-16 h-16 mb-4 opacity-20" />
                                    <p className="text-slate-400 font-medium text-center px-4">Pilih materi video untuk mulai belajar</p>
                                </div>
                            )}
                        </div>

                        {/* Current Material Info */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {classroom?.namaParent2}
                            </h2>
                            <p className="text-gray-600 leading-relaxed mb-6">
                                {classroom?.descParent2 || 'Selamat datang di ruang belajar Anda. Silakan akses materi yang telah disediakan oleh pengajar di bawah ini.'}
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
                                    <Clock className="w-4 h-4 text-blue-500" />
                                    <span>Tahun Ajaran: <b>{classroom?.tahunAjaran}</b></span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-xl">
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                    <span>Total Materi: <b>{classroom?.products?.length || 0}</b></span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Material List */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-180px)] overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                    Daftar Materi
                                </h3>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input 
                                        type="text" 
                                        placeholder="Cari materi..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {filteredMaterials && filteredMaterials.length > 0 ? (
                                    filteredMaterials.map((product: any) => (
                                        <div 
                                            key={product.idProduk}
                                            className="group bg-white rounded-xl border border-gray-100 p-4 transition-all hover:shadow-md hover:border-blue-200"
                                        >
                                            <div className="flex items-start gap-3 mb-3">
                                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                    <BookOpen className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                                                        {product.namaProduk}
                                                    </h4>
                                                    {product.descProduk && (
                                                        <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{product.descProduk}</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-wrap gap-2">
                                                {product.buttons?.map((btn: any) => {
                                                    const isVideo = btn.tipeButton === 'Video';
                                                    return (
                                                        <button
                                                            key={btn.idButton}
                                                            onClick={() => {
                                                                if (isVideo) {
                                                                    setSelectedVideo(btn.urlLink);
                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                } else {
                                                                    window.open(btn.urlLink, '_blank');
                                                                }
                                                            }}
                                                            className={`
                                                                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                                                ${isVideo 
                                                                    ? (selectedVideo === btn.urlLink 
                                                                        ? 'bg-blue-600 text-white shadow-blue-100 shadow-md' 
                                                                        : 'bg-gray-50 text-blue-600 border border-transparent hover:bg-blue-50')
                                                                    : 'bg-gray-50 text-purple-600 border border-transparent hover:bg-purple-50'
                                                                }
                                                            `}
                                                        >
                                                            {isVideo ? <Play className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                                                            {btn.judul || (isVideo ? 'Tonton' : 'Download')}
                                                        </button>
                                                    );
                                                })}
                                                {(!product.buttons || product.buttons.length === 0) && (
                                                    <div className="text-[10px] text-gray-400 italic">Belum ada link materi</div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-12">
                                        <Search className="w-10 h-10 mx-auto text-gray-200 mb-2" />
                                        <p className="text-xs text-gray-500">Materi tidak ditemukan</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}
