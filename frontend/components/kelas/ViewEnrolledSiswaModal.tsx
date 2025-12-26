import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, Trash2, RefreshCw, Download } from 'lucide-react';
import { showSuccess, showError } from '@/lib/utils/toast';
import { siswaKelasService, SiswaKelas } from '@/lib/api/siswaKelas.service';

interface ViewEnrolledSiswaModalProps {
    isOpen: boolean;
    onClose: () => void;
    idParent2: number;
    namaRuangKelas: string;
}

export const ViewEnrolledSiswaModal: React.FC<ViewEnrolledSiswaModalProps> = ({
    isOpen,
    onClose,
    idParent2,
    namaRuangKelas
}) => {
    const [enrollments, setEnrollments] = useState<SiswaKelas[]>([]);
    const [loading, setLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            fetchEnrollments();
        }
    }, [isOpen, statusFilter]);

    const fetchEnrollments = async () => {
        try {
            setLoading(true);
            const response = await siswaKelasService.getAll({
                idParent2,
                statusEnrollment: statusFilter || undefined
            });
            setEnrollments(response.data.data || response.data);
        } catch (error: any) {
            showError(error.message || 'Gagal memuat data siswa');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (idSiswaKelas: number, newStatus: string) => {
        try {
            await siswaKelasService.updateStatus(idSiswaKelas, { statusEnrollment: newStatus });
            showSuccess(`Status berhasil diubah menjadi ${newStatus}`);
            fetchEnrollments();
        } catch (error: any) {
            showError(error.message || 'Gagal mengubah status');
        }
    };

    const handleRemove = async (idSiswaKelas: number, namaLengkap: string) => {
        if (!confirm(`Hapus ${namaLengkap} dari kelas ini?`)) return;

        try {
            await siswaKelasService.delete(idSiswaKelas);
            showSuccess(`${namaLengkap} berhasil dihapus`);
            fetchEnrollments();
        } catch (error: any) {
            showError(error.message || 'Gagal menghapus siswa');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Aktif': return 'success';
            case 'Pending': return 'warning';
            case 'Lulus': return 'info';
            case 'Dropout': return 'danger';
            default: return 'default';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Siswa Terdaftar - ${namaRuangKelas}`}
            size="xl"
        >
            <div className="space-y-4">
                {/* Filter Status */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Filter Status:</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Semua Status</option>
                        <option value="Aktif">Aktif</option>
                        <option value="Pending">Pending</option>
                        <option value="Lulus">Lulus</option>
                        <option value="Dropout">Dropout</option>
                    </select>
                    <Button variant="ghost" size="sm" onClick={fetchEnrollments}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>

                {/* Stats */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">
                            Total: <span className="text-blue-600 font-bold">{enrollments.length}</span> siswa
                        </span>
                    </div>
                </div>

                {/* Student List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="py-12 text-center text-gray-500">
                                Loading...
                            </div>
                        ) : enrollments.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                Belum ada siswa terdaftar
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">No</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nama</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">No HP</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Tgl Masuk</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {enrollments.map((enrollment, index) => (
                                        <tr key={enrollment.idSiswaKelas} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">{index + 1}</td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{enrollment.siswa?.namaLengkap || '-'}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{enrollment.siswa?.email || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{enrollment.siswa?.noHp || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatDate(enrollment.tanggalMasuk)}</td>
                                            <td className="px-4 py-3">
                                                <select
                                                    value={enrollment.statusEnrollment}
                                                    onChange={(e) => handleUpdateStatus(enrollment.idSiswaKelas, e.target.value)}
                                                    className={`text-xs px-2 py-1 rounded-full border-0 font-medium ${enrollment.statusEnrollment === 'Aktif' ? 'bg-green-100 text-green-800' :
                                                            enrollment.statusEnrollment === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                enrollment.statusEnrollment === 'Lulus' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-red-100 text-red-800'
                                                        }`}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Aktif">Aktif</option>
                                                    <option value="Lulus">Lulus</option>
                                                    <option value="Dropout">Dropout</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => handleRemove(enrollment.idSiswaKelas, enrollment.siswa?.namaLengkap || 'Siswa')}
                                                    className="p-2 hover:bg-red-50 rounded"
                                                    title="Hapus dari kelas"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-600" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose}>
                        Tutup
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
