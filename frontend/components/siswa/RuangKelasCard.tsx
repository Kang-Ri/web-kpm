'use client';

import { FC } from 'react';
import { Users, Calendar, DollarSign, CheckCircle } from 'lucide-react';

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
        isEnrolled,
        kategoriHargaDaftarUlang,
        hargaDaftarUlang
    } = ruangKelas;

    const isUnlimited = kapasitasMaksimal === null || kapasitasMaksimal === undefined;
    const isAlmostFull = !isUnlimited && tersedia !== null && tersedia <= 5 && tersedia > 0;
    
    // Format array of classes string e.g. ["3", "8"] -> "3, 8"
    const displayJenjang = () => {
        try {
            if (Array.isArray(jenjangKelasIzin)) {
                return jenjangKelasIzin.join(', ');
            }
            // in case it's a stringified JSON array
            if (jenjangKelasIzin && jenjangKelasIzin.startsWith('[')) {
                return JSON.parse(jenjangKelasIzin).join(', ');
            }
        } catch (e) {
            // fallback
        }
        return jenjangKelasIzin;
    };

    // Format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-200">
            {/* Image Section */}
            <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600 overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center text-white">
                        <div className="text-6xl mb-2">📚</div>
                        <p className="text-sm font-medium">Ruang Kelas</p>
                    </div>
                </div>

                {/* Status Badge */}
                {isFull && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        PENUH
                    </div>
                )}
                {isAlmostFull && !isFull && (
                    <div className="absolute top-3 right-3 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        HAMPIR PENUH
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-4">
                {/* Title */}
                <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {namaParent2}
                </h3>

                {/* Description */}
                {descParent2 && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {descParent2}
                    </p>
                )}

                <div className="border-t border-gray-200 pt-3 space-y-2">
                    {/* Capacity */}
                    <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 mr-2 text-blue-600" />
                        <span className="font-medium">Kapasitas:</span>
                        <span className="ml-1">
                            {isUnlimited ? 'Tanpa Batas' : `${siswaEnrolled}/${kapasitasMaksimal} siswa`}
                        </span>
                    </div>

                    {/* Available Seats */}
                    <div className="flex items-center text-sm">
                        <CheckCircle className={`w-4 h-4 mr-2 ${isFull ? 'text-red-500' :
                                isAlmostFull ? 'text-orange-500' :
                                    'text-green-500'
                            }`} />
                        <span className="font-medium text-gray-700">Tersedia:</span>
                        <span className={`ml-1 font-semibold ${isFull ? 'text-red-600' :
                                isAlmostFull ? 'text-orange-600' :
                                    'text-green-600'
                            }`}>
                            {isUnlimited ? 'Terbuka' : `${tersedia} kursi`}
                        </span>
                    </div>

                    {/* Grade Level */}
                    <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 mr-2 text-purple-600" />
                        <span className="font-medium">Kelas:</span>
                        <span className="ml-1">{displayJenjang()}</span>
                    </div>

                    {/* Year */}
                    {tahunAjaran && (
                        <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="w-4 h-4 mr-2 text-indigo-600" />
                            <span className="font-medium">Tahun Ajaran:</span>
                            <span className="ml-1">{tahunAjaran}</span>
                        </div>
                    )}

                    {/* Price */}
                    <div className="border-t border-gray-100 pt-2 mt-2">
                        {kategoriHargaDaftarUlang === 'Gratis' ? (
                            <div className="flex items-center">
                                <span className="text-2xl font-bold text-green-600">GRATIS</span>
                            </div>
                        ) : kategoriHargaDaftarUlang === 'Seikhlasnya' ? (
                            <div className="flex items-center">
                                <span className="text-lg font-semibold text-blue-600">Seikhlasnya</span>
                            </div>
                        ) : (
                            <div className="flex items-center">
                                <DollarSign className="w-5 h-5 text-orange-600 mr-1" />
                                <span className="text-2xl font-bold text-orange-600">
                                    {formatPrice(hargaDaftarUlang)}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Enroll Button */}
                {isEnrolled ? (
                    <button
                        disabled
                        className="w-full mt-4 py-3 px-4 rounded-lg font-semibold text-gray-700 bg-gray-300 cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <CheckCircle className="w-5 h-5" />
                        Sudah Terdaftar
                    </button>
                ) : (
                    <button
                        onClick={() => onEnroll(idParent2)}
                        disabled={isFull || isLoading}
                        className={`
                            w-full mt-4 py-3 px-4 rounded-lg font-semibold text-white
                            transition-all duration-200 flex items-center justify-center gap-2
                            ${isFull
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg'
                            }
                        `}
                    >
                        {isLoading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                <span>Processing...</span>
                            </>
                        ) : isFull ? (
                            <>❌ Kelas Penuh</>
                        ) : (
                            <>🎓 Daftar Sekarang</>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};
