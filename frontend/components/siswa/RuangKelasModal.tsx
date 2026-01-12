'use client';

import { FC, useEffect, useState } from 'react';
import { X, Loader2, Info } from 'lucide-react';
import { RuangKelasCard } from './RuangKelasCard';
import { siswaService } from '@/lib/api/siswa.service';
import { toast } from 'react-hot-toast';

interface RuangKelasModalProps {
    isOpen: boolean;
    onClose: () => void;
    idSiswa: number;
    idParent1: number;
    namaParent1: string;
}

interface RuangKelasData {
    parent1: {
        idParent1: number;
        namaParent1: string;
        descParent1?: string;
    };
    ruangKelas: any[];
}

export const RuangKelasModal: FC<RuangKelasModalProps> = ({
    isOpen,
    onClose,
    idSiswa,
    idParent1,
    namaParent1
}) => {
    const [data, setData] = useState<RuangKelasData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [enrollingId, setEnrollingId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && idSiswa && idParent1) {
            fetchRuangKelas();
        }
    }, [isOpen, idSiswa, idParent1]);

    const fetchRuangKelas = async () => {
        try {
            setIsLoading(true);
            const response = await siswaService.getParent2List(idSiswa, idParent1);
            setData(response.data);
        } catch (error: any) {
            console.error('Error fetching ruang kelas:', error);
            toast.error(error.response?.data?.message || 'Gagal memuat daftar ruang kelas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEnroll = async (idParent2: number) => {
        try {
            setEnrollingId(idParent2);

            // Call real enrollment API
            const response = await siswaService.enroll(idSiswa, idParent2);

            // Show success message from backend
            const message = response.data?.message || 'Pendaftaran berhasil!';
            toast.success(message);

            // Reload data to update capacity
            await fetchRuangKelas();

            // Close modal after short delay
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (error: any) {
            console.error('Error enrolling:', error);
            const errorMessage = error.response?.data?.message || 'Gagal mendaftar. Silakan coba lagi.';
            toast.error(errorMessage);
        } finally {
            setEnrollingId(null);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{namaParent1}</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Pilih ruang kelas yang sesuai dengan jadwal Anda
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        </div>
                    ) : data && data.ruangKelas.length > 0 ? (
                        <>
                            {/* Description */}
                            {data.parent1.descParent1 && (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
                                    <p className="text-sm text-blue-800">{data.parent1.descParent1}</p>
                                </div>
                            )}

                            {/* Ruang Kelas Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {data.ruangKelas.map((kelas) => (
                                    <RuangKelasCard
                                        key={kelas.idParent2}
                                        ruangKelas={kelas}
                                        onEnroll={handleEnroll}
                                        isLoading={enrollingId === kelas.idParent2}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12">
                            <Info className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                Tidak Ada Ruang Kelas Tersedia
                            </h3>
                            <p className="text-gray-600">
                                Belum ada ruang kelas yang dibuka untuk kelas Anda saat ini.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
