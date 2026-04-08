'use client';

import { FC } from 'react';
import { Users, Calendar, DollarSign, CheckCircle, Info, Loader2, GraduationCap } from 'lucide-react';

interface RuangKelasCardProps {
    ruangKelas: {
        idParent2: number;
        namaParent2: string;
        descParent2?: string;
        jenjangKelasIzin: string;
        tahunAjaran?: string;
        kapasitasMaksimal: number;
        siswaEnrolled: number;
        tersedia: number;
        isFull: boolean;
        isEnrolled: boolean;
        userStatus: 'Aktif' | 'Pending' | null;
        kategoriHargaDaftarUlang: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
        hargaDaftarUlang: number;
    };
    onEnroll: (idParent2: number) => void;
    isLoading?: boolean;
}

export const RuangKelasCard: FC<RuangKelasCardProps> = ({
    ruangKelas,
    onEnroll,
    isLoading = false
}) => {
    const {
        idParent2,
        namaParent2,
        descParent2,
        jenjangKelasIzin,
        tahunAjaran,
        kapasitasMaksimal,
        siswaEnrolled,
        tersedia,
        isFull,
        userStatus,
        kategoriHargaDaftarUlang,
        hargaDaftarUlang,
    } = ruangKelas;

    const isAktif = userStatus === 'Aktif';
    const isPending = userStatus === 'Pending';
    const isUnlimited = kapasitasMaksimal === null || kapasitasMaksimal === undefined;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const LoaderIcon = () => (
        <Loader2 className="w-5 h-5 animate-spin" />
    );

    return (
        <div className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 flex flex-col h-full ${
            isAktif ? 'border-green-500/30' : isPending ? 'border-orange-500/30' : ''
        }`}>
            {/* Header with Centered Icon (Premium Style) */}
            <div className={`relative h-32 bg-gradient-to-br transition-all duration-500 ${
                isAktif ? 'from-green-500 to-emerald-600' :
                isPending ? 'from-orange-500 to-red-600' :
                'from-blue-600 via-blue-500 to-purple-600'
            }`}>
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white,transparent)]"></div>
                <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shadow-lg transform group-hover:scale-110 transition-transform duration-500">
                        <GraduationCap className="w-8 h-8" />
                    </div>
                    <span className="text-[10px] font-bold mt-2 uppercase tracking-widest opacity-80">Ruang Kelas</span>
                </div>
                
                {/* Badges */}
                {isAktif ? (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        AKTIF
                    </div>
                ) : isPending ? (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        BELUM SELESAI
                    </div>
                ) : null}
            </div>

            {/* Content Body */}
            <div className="p-6 flex-1 flex flex-col">
                <div className="mb-4">
                    <h3 className="font-extrabold text-lg text-gray-900 line-clamp-1 mb-2 group-hover:text-blue-600 transition-colors">
                        {namaParent2}
                    </h3>
                    {descParent2 && (
                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed min-h-[2.5rem]">
                            {descParent2}
                        </p>
                    )}
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-4 mb-6">
                    {/* Capacity */}
                    <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-3 text-blue-500" />
                        <span className="font-medium mr-1 underline decoration-blue-100 underline-offset-4">Kapasitas:</span>
                        <span className="font-semibold text-gray-900">
                            {isUnlimited ? 'Tanpa Batas' : `${kapasitasMaksimal} Siswa`}
                        </span>
                    </div>

                    {/* Available */}
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckCircle className={`w-4 h-4 mr-3 ${isFull ? 'text-red-500' : 'text-green-500'}`} />
                        <span className="font-medium mr-1 underline decoration-green-100 underline-offset-4">Tersedia:</span>
                        <span className={`font-bold ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                            {isFull ? 'Penuh' : (isUnlimited ? 'Terbuka' : `${tersedia} Kursi`)}
                        </span>
                    </div>

                    {/* Grade/Level */}
                    <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-3 text-purple-500" />
                        <span className="font-medium mr-1 underline decoration-purple-100 underline-offset-4">Kelas:</span>
                        <span className="font-semibold text-gray-900">{jenjangKelasIzin}</span>
                    </div>

                    {/* School Year */}
                    {tahunAjaran && (
                        <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-3 text-pink-500" />
                            <span className="font-medium mr-1 underline decoration-pink-100 underline-offset-4">Tahun Ajaran:</span>
                            <span className="font-semibold text-gray-900">{tahunAjaran}</span>
                        </div>
                    )}
                </div>

                {/* Pricing & Actions */}
                <div className="mt-auto">
                    <div className="mb-4">
                        {kategoriHargaDaftarUlang === 'Gratis' ? (
                            <span className="text-xl font-black text-green-600 uppercase italic">Gratis</span>
                        ) : kategoriHargaDaftarUlang === 'Seikhlasnya' ? (
                            <span className="text-xl font-black text-blue-600 uppercase italic">Seikhlasnya</span>
                        ) : (
                            <div className="flex flex-col">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-1">Investasi</span>
                                <span className="text-xl font-black text-orange-600 leading-none">
                                    {formatCurrency(hargaDaftarUlang)}
                                </span>
                            </div>
                        )}
                    </div>

                    {isAktif ? (
                        <button
                            disabled
                            className="w-full py-3 px-4 rounded-xl font-bold text-gray-400 bg-gray-100/80 border-2 border-gray-200 cursor-not-allowed flex items-center justify-center gap-2 text-sm shadow-inner"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Sudah Terdaftar
                        </button>
                    ) : isPending ? (
                        <button
                            onClick={() => onEnroll(idParent2)}
                            disabled={isLoading}
                            className="w-full py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg shadow-orange-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
                        >
                            {isLoading ? <LoaderIcon /> : (
                                <>
                                    <Info className="w-4 h-4" />
                                    Lanjutkan Pendaftaran
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={() => onEnroll(idParent2)}
                            disabled={isFull || isLoading}
                            className={`
                                w-full py-3 px-4 rounded-xl font-bold text-white transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-sm shadow-lg
                                ${isFull 
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-200'
                                }
                            `}
                        >
                            {isLoading ? <LoaderIcon /> : (
                                <>
                                    <DollarSign className="w-4 h-4" />
                                    Daftar Sekarang
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
