'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    BookOpen, 
    Video, 
    FileText, 
    ChevronRight, 
    ChevronDown,
    Play, 
    Download, 
    Lock, 
    Unlock,
    Loader2,
    Calendar,
    Layout,
    Clock,
    AlertCircle,
    CheckCircle2,
    CreditCard,
    ArrowLeft
} from 'lucide-react';
import { siswaService } from '@/lib/api/siswa.service';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { PaymentStatusModal } from '@/components/siswa/PaymentStatusModal';
import { useAuthStore } from '@/lib/store/authStore';

export default function ClassroomPage() {
    const params = useParams();
    const router = useRouter();
    const idParent2 = params.idParent2;
    
    // Auth Store for student ID
    const userFromStore = useAuthStore((state) => state.user);
    const idSiswa = userFromStore?.idSiswa;

    const [loading, setLoading] = useState(true);
    const [classroom, setClassroom] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    
    // Accordion State
    const [expandedId, setExpandedId] = useState<number | null>(null);
    
    // Purchase processing state
    const [isProcessingPurchase, setIsProcessingPurchase] = useState<number | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    const fetchContent = useCallback(async (currentIdSiswa: number) => {
        try {
            console.log(`[RUANG BELAJAR] Fetching content for idSiswa: ${currentIdSiswa}, idParent2: ${idParent2}`);
            setLoading(true);
            const response = await siswaService.getClassroomContent(currentIdSiswa, parseInt(idParent2 as string));
            console.log('[RUANG BELAJAR] Data received:', response.data.data);
            setClassroom(response.data.data);
            
            // Auto-expand first unlocked module if any
            const firstUnlocked = response.data.data?.products?.find((p: any) => !p.isLocked);
            if (firstUnlocked) {
                setExpandedId(firstUnlocked.idProduk);
            }
            
            setError(null);
        } catch (err: any) {
            console.error('[RUANG BELAJAR] Error fetching content:', err);
            setError(err.response?.data?.message || 'Gagal mengambil materi kelas.');
        } finally {
            setLoading(false);
        }
    }, [idParent2]);

    useEffect(() => {
        if (idSiswa && idParent2) {
            fetchContent(idSiswa);
        }
    }, [idSiswa, idParent2, fetchContent]);

    // Safety Timeout if stuck in loading
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (loading && !error) {
                setError('Waktu pemuatan berakhir atau data profil siswa tidak ditemukan.');
                setLoading(false);
            }
        }, 5000);

        return () => clearTimeout(timeout);
    }, [loading, error]);

    const handleToggleAccordion = (productId: number) => {
        setExpandedId(prev => prev === productId ? null : productId);
    };

    const handleBuyMateri = async (product: any) => {
        if (!idSiswa) return;
        
        try {
            setIsProcessingPurchase(product.idProduk);
            const response = await siswaService.buyMateri(idSiswa, product.idProduk);
            
            const resData = response.data.data || response.data;
            
            if (resData.directlyActive) {
                await fetchContent(idSiswa);
                return;
            }

            const orderData = {
                idOrder: resData.idOrder,
                statusPembayaran: resData.statusPembayaran,
                hargaFinal: parseFloat(resData.hargaFinal ?? resData.orderData?.hargaFinal ?? product.hargaJual ?? 0),
                needsPayment: resData.needsPayment
            };

            const enrollmentInfo = {
                namaKelas: classroom?.namaParent2 || classroom?.namaRuangKelas || classroom?.nama || product.namaProduk,
                namaMateri: product.namaProduk,
                kategoriHarga: product.kategoriHarga,
                hargaDaftarUlang: orderData.hargaFinal,
                statusEnrollment: 'Pending'
            };

            setSelectedProduct({
                ...product,
                orderData,
                enrollmentInfo
            });
            setShowPaymentModal(true);
        } catch (err: any) {
            console.error('Error buying materi:', err);
            alert(err.response?.data?.message || err.response?.data?.msg || 'Gagal memproses pembelian materi.');
        } finally {
            setIsProcessingPurchase(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-gray-900 font-bold uppercase tracking-widest text-[10px]">Menyiapkan Ruang Belajar...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-2xl mx-auto mt-20 p-8 bg-white rounded-2xl shadow-sm border border-gray-200 text-center">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-6" />
                <h2 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-tight">Ada Masalah</h2>
                <p className="text-sm text-gray-500 mb-8 leading-relaxed font-medium">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-bold text-xs uppercase tracking-wide">Coba Lagi</button>
            </div>
        );
    }

    return (
        <ProtectedRoute allowedRoles={['Siswa']}>
            <main className="min-h-screen bg-gray-50/50 pb-20">
                {/* Header Section */}
                <div className="bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <button 
                                    onClick={() => router.push('/siswa/dashboard')}
                                    className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest hover:translate-x-[-4px] transition-transform mb-2"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                    <span>Kembali ke Dashboard</span>
                                </button>
                                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight leading-none">
                                    {classroom?.namaParent2 || 'Materi Pembelajaran'}
                                </h1>
                                <div className="flex items-center gap-4 text-gray-400 text-xs font-semibold pt-1">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>{classroom?.tahunAjaran || '2025/2026'}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-gray-200" />
                                    <div className="flex items-center gap-1.5">
                                        <Layout className="w-3.5 h-3.5" />
                                        <span>{classroom?.products?.length || 0} Modul Materi</span>
                                    </div>
                                </div>
                                {classroom?.descParent2 && (
                                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-2xl pt-2 border-t border-gray-100 mt-2">
                                        {classroom.descParent2}
                                    </p>
                                )}
                            </div>
                            
                            <div className="flex items-center gap-3 bg-green-50 px-5 py-3 rounded-xl border border-green-200">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <div>
                                    <p className="text-[9px] font-bold text-green-700 uppercase tracking-widest leading-none mb-0.5 opacity-80">Status Akses</p>
                                    <p className="text-xs font-bold text-green-600">Aktif & Terverifikasi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className="max-w-7xl mx-auto px-6 mt-10">
                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight uppercase tracking-wider">Eksplorasi Modul</h2>
                        <p className="text-gray-400 text-sm font-medium italic">Klik modul untuk mengakses isi materi belajar Anda</p>
                    </div>

                    <div className="space-y-6">
                        {classroom?.products && classroom.products.length > 0 ? (
                            classroom.products.map((product: any) => {
                                const isExpanded = expandedId === product.idProduk;
                            
                            return (
                                <div 
                                    key={product.idProduk}
                                    className={`
                                        relative group bg-white rounded-2xl border transition-all duration-300 overflow-hidden
                                        ${isExpanded 
                                            ? 'border-blue-500/30 shadow-xl' 
                                            : 'border-gray-200 shadow-sm hover:border-blue-500/20'
                                        }
                                    `}
                                >
                                    {/* 1. Accordion Header: Clickable Area */}
                                    <button
                                        onClick={() => handleToggleAccordion(product.idProduk)}
                                        className={`
                                            w-full flex items-start text-left gap-6 p-4 md:p-5 transition-colors
                                            ${isExpanded ? 'bg-blue-50/20' : 'hover:bg-gray-50/50'}
                                            ${product.isLocked ? 'grayscale opacity-60' : ''}
                                        `}
                                    >
                                        <div className={`
                                            w-14 h-14 rounded-xl flex items-center justify-center shrink-0 transition-all
                                            ${product.isLocked ? 'bg-gray-100 text-gray-300' : 'bg-blue-600 text-white shadow-md shadow-blue-100'}
                                        `}>
                                            {product.isLocked ? <Lock className="w-7 h-7" /> : <Unlock className="w-7 h-7" />}
                                        </div>
                                        
                                        <div className="flex-1 space-y-2 mt-1">
                                            <h4 className="text-lg font-bold text-gray-900 leading-tight uppercase tracking-tight">
                                                {product.namaProduk}
                                            </h4>
                                            <p className="text-gray-500 text-xs md:text-sm leading-relaxed max-w-4xl font-medium line-clamp-2">
                                                {product.descProduk || 'Aktivasi modul ini untuk mengakses seluruh materi latihan secara eksklusif.'}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-end gap-1.5 ml-2 shrink-0">
                                            {/* Harga + Status Badge */}
                                            <span className={`text-xs font-bold whitespace-nowrap ${product.isLocked ? 'text-red-500' : 'text-green-600'}`}>
                                                {product.kategoriHarga === 'Bernominal'
                                                    ? `Rp ${Number(product.hargaJual).toLocaleString('id-ID')}`
                                                    : product.kategoriHarga === 'Seikhlasnya'
                                                        ? 'Seikhlasnya'
                                                        : 'Gratis'
                                                }
                                                {' | '}
                                                {product.isLocked ? 'Belum Aktif' : 'Sudah Aktif'}
                                            </span>
                                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-500' : ''}`} />
                                        </div>
                                    </button>

                                    {/* 2. Accordion Content Area: Grid or Access CTA */}
                                    <div className={`
                                        transition-all duration-500 ease-in-out border-t border-gray-100
                                        ${isExpanded ? 'max-h-[2000px] opacity-100 p-4 md:p-5' : 'max-h-0 opacity-0 overflow-hidden'}
                                    `}>
                                        {product.isLocked ? (
                                            <div className="bg-gray-50/50 rounded-xl p-8 border-2 border-dashed border-gray-200 flex flex-col items-center text-center gap-6">
                                                <div className="space-y-2">
                                                    <h5 className="text-base font-bold text-gray-900 uppercase tracking-wide">Akses Modul Belum Aktif</h5>
                                                    <p className="text-xs text-gray-500 max-w-sm font-medium">Selesaikan pendaftaran modul untuk mulai belajar materi ini.</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleBuyMateri(product);
                                                    }}
                                                    disabled={isProcessingPurchase === product.idProduk}
                                                    className="inline-flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm tracking-wide hover:bg-blue-700 transition-all shadow-md shadow-blue-200 active:scale-95 disabled:opacity-50"
                                                >
                                                    {isProcessingPurchase === product.idProduk ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                                                    {product.kategoriHarga === 'Seikhlasnya' ? 'BAYAR SEIKHLASNYA' : 'AKTIVASI SEKARANG'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                                {product.buttons?.map((btn: any) => {
                                                    const isVideo = btn.namaButton?.toLowerCase().includes('video') || btn.linkTujuan?.includes('youtube.com') || btn.linkTujuan?.includes('youtu.be');
                                                    const isZoom = btn.namaButton?.toLowerCase().includes('zoom') || btn.judulButton?.toLowerCase().includes('zoom');
                                                    
                                                    const now = new Date();
                                                    const isActive = btn.statusButton === 'Active' && (!btn.tanggalPublish || now >= new Date(btn.tanggalPublish)) && (!btn.tanggalExpire || now <= new Date(btn.tanggalExpire));

                                                    return (
                                                        <div 
                                                            key={btn.idButton}
                                                            className={`
                                                                relative bg-white rounded-xl p-5 border border-gray-200 shadow-sm transition-all hover:shadow-lg hover:border-blue-500/20 hover:-translate-y-1 flex flex-col
                                                                ${!isActive ? 'grayscale opacity-60' : ''}
                                                            `}
                                                        >
                                                            <div className="flex items-start gap-4 mb-5">
                                                                <div className={`
                                                                    w-10 h-10 rounded-lg flex items-center justify-center shrink-0
                                                                    ${isZoom ? 'bg-blue-50 text-blue-600' : isVideo ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
                                                                `}>
                                                                    {isZoom ? <Video className="w-5 h-5" /> : isVideo ? <Play className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <h5 className="font-bold text-gray-900 uppercase tracking-widest text-[11px] mb-1.5 opacity-90 leading-tight">
                                                                        {btn.judulButton || 'Akses Materi'}
                                                                    </h5>
                                                                    <p className="text-[12.5px] text-gray-400 font-semibold leading-relaxed line-clamp-2">
                                                                        {btn.deskripsiButton || 'Silakan ikuti instruksi pengajar untuk materi ini.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="mt-auto space-y-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        isActive && window.open(btn.linkTujuan, '_blank');
                                                                    }}
                                                                    disabled={!isActive}
                                                                    className={`
                                                                        w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all border shadow-sm
                                                                        ${!isActive 
                                                                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed shadow-none' 
                                                                            : isZoom ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                                                                            : isVideo ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' 
                                                                            : 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                                                                        }
                                                                    `}
                                                                >
                                                                    {isActive ? (isZoom ? <Video className="w-3.5 h-3.5" /> : isVideo ? <Play className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />) : <Lock className="w-3.5 h-3.5" />}
                                                                    <span>{btn.namaButton}</span>
                                                                </button>
                                                                
                                                                {!isActive && (
                                                                    <div className="flex items-center justify-center gap-1.5 text-[8px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50/50 py-1.5 rounded-lg border border-amber-100/30">
                                                                        <Clock className="w-2.5 h-2.5" />
                                                                        <span>BELUM TERSEDIA</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="bg-white rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookOpen className="w-10 h-10 text-gray-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-tight">Materi Belum Tersedia</h3>
                                <p className="text-gray-400 text-sm font-medium max-w-sm mx-auto leading-relaxed">
                                    Modul pembelajaran untuk kelas ini sedang dalam tahap persiapan oleh pengajar. Silakan cek kembali secara berkala.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {showPaymentModal && selectedProduct && (
                    <PaymentStatusModal
                        isOpen={showPaymentModal}
                        onClose={() => {
                            setShowPaymentModal(false);
                            if (idSiswa) fetchContent(idSiswa);
                        }}
                        orderData={selectedProduct.orderData}
                        enrollmentInfo={selectedProduct.enrollmentInfo}
                        onPaymentSuccess={() => {
                            setShowPaymentModal(false);
                            if (idSiswa) fetchContent(idSiswa);
                        }}
                    />
                )}
            </main>
        </ProtectedRoute>
    );
}
