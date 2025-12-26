import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { X } from 'lucide-react';

interface SiswaAccess {
    idAkses: number;
    statusAkses: string;
    tanggalAkses: string;
    siswa: {
        namaLengkap: string;
        email: string;
        noHp: string;
        jenjangKelas: string;
        asalSekolah: string;
    };
}

interface SiswaListModalProps {
    isOpen: boolean;
    onClose: () => void;
    idProduk: number;
    materiName: string;
}

export const SiswaListModal: React.FC<SiswaListModalProps> = ({
    isOpen,
    onClose,
    idProduk,
    materiName
}) => {
    const [siswaList, setSiswaList] = useState<SiswaAccess[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && idProduk) {
            fetchSiswa();
        }
    }, [isOpen, idProduk]);

    const fetchSiswa = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/v1/cms/materi/${idProduk}/siswa`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                }
            });
            const result = await response.json();
            setSiswaList(result.data || []);
        } catch (error) {
            console.error('Failed to fetch siswa:', error);
            setSiswaList([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Siswa yang Mengakses - ${materiName}`}
            size="xl"
        >
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : siswaList.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Belum ada siswa yang mengakses materi ini
                    </div>
                ) : (
                    <>
                        <div className="mb-4 text-sm text-gray-600">
                            Total: <span className="font-semibold">{siswaList.length}</span> siswa
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">#</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Nama</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Jenjang</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Email</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Waktu Akses</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {siswaList.map((item, index) => (
                                        <tr key={item.idAkses} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-2 px-3 text-gray-600">{index + 1}</td>
                                            <td className="py-2 px-3">
                                                <div className="font-medium text-gray-900">{item.siswa?.namaLengkap || '-'}</div>
                                                <div className="text-xs text-gray-500">{item.siswa?.asalSekolah || '-'}</div>
                                            </td>
                                            <td className="py-2 px-3 text-gray-600">{item.siswa?.jenjangKelas || '-'}</td>
                                            <td className="py-2 px-3 text-sm text-gray-600">{item.siswa?.email || '-'}</td>
                                            <td className="py-2 px-3">
                                                <Badge variant={item.statusAkses === 'Unlocked' ? 'success' : 'warning'}>
                                                    {item.statusAkses}
                                                </Badge>
                                            </td>
                                            <td className="py-2 px-3 text-sm text-gray-600">
                                                {item.tanggalAkses ? formatDate(item.tanggalAkses) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                <div className="flex justify-end pt-4 border-t">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </Modal>
    );
};
