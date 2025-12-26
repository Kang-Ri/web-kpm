import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { UserPlus, Search, CheckCircle, XCircle } from 'lucide-react';
import { showSuccess, showError } from '@/lib/utils/toast';
import { siswaKelasService, AvailableStudent } from '@/lib/api/siswaKelas.service';

interface EnrollSiswaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnrollComplete: () => void;
    idParent2: number;
    namaRuangKelas: string;
}

export const EnrollSiswaModal: React.FC<EnrollSiswaModalProps> = ({
    isOpen,
    onClose,
    onEnrollComplete,
    idParent2,
    namaRuangKelas
}) => {
    const [search, setSearch] = useState('');
    const [students, setStudents] = useState<AvailableStudent[]>([]);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [enrolling, setEnrolling] = useState(false);

    // Debounced search - wait 500ms after user stops typing
    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = setTimeout(() => {
            fetchStudents();
        }, search ? 500 : 0);

        return () => clearTimeout(timeoutId);
    }, [isOpen, search]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await siswaKelasService.getAvailable(idParent2, search);
            setStudents(response.data.data);
        } catch (error: any) {
            showError(error.message || 'Gagal memuat siswa');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === students.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(students.map(s => s.idSiswa));
        }
    };

    const handleSelectOne = (idSiswa: number) => {
        if (selectedIds.includes(idSiswa)) {
            setSelectedIds(selectedIds.filter(id => id !== idSiswa));
        } else {
            setSelectedIds([...selectedIds, idSiswa]);
        }
    };

    const handleEnroll = async () => {
        if (selectedIds.length === 0) {
            showError('Pilih minimal 1 siswa');
            return;
        }

        try {
            setEnrolling(true);
            const response = await siswaKelasService.bulkEnroll(selectedIds, idParent2);
            const result = response.data.data || response.data;

            if (result.success && result.success.length > 0) {
                showSuccess(`Berhasil mendaftarkan ${result.success.length} siswa`);
            }

            if (result.failed && result.failed.length > 0) {
                showError(`${result.failed.length} siswa gagal didaftarkan`);
            }

            onEnrollComplete();
            handleClose();
        } catch (error: any) {
            showError(error.message || 'Gagal mendaftarkan siswa');
        } finally {
            setEnrolling(false);
        }
    };

    const handleClose = () => {
        setSearch('');
        setSelectedIds([]);
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={`Tambah Siswa ke ${namaRuangKelas}`}
            size="xl"
        >
            <div className="space-y-4">
                {/* Search */}
                <div className="flex gap-3">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama atau email siswa..."
                                value={search}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            {loading ? 'Mencari...' : `Menampilkan siswa yang diizinkan untuk kelas ini (max 100)`}
                        </p>
                    </div>
                </div>

                {/* Student List */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                                {loading ? 'Loading...' : `${students.length} Siswa Tersedia`}
                            </span>
                            {students.length > 0 && !loading && (
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    {selectedIds.length === students.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 space-y-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 animate-pulse">
                                        <div className="w-4 h-4 bg-gray-200 rounded"></div>
                                        <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                                        <div className="w-32 h-4 bg-gray-200 rounded"></div>
                                        <div className="w-24 h-4 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : students.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                Tidak ada siswa yang tersedia
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="w-12 px-4 py-3"></th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Nama</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Jenjang</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Asal Sekolah</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr
                                            key={student.idSiswa}
                                            onClick={() => handleSelectOne(student.idSiswa)}
                                            className={`cursor-pointer hover:bg-blue-50 ${selectedIds.includes(student.idSiswa) ? 'bg-blue-50' : 'bg-white'}`}
                                        >
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(student.idSiswa)}
                                                    onChange={() => handleSelectOne(student.idSiswa)}
                                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.namaLengkap}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">Kelas {student.jenjangKelas}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{student.asalSekolah || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Selected Count */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                        <CheckCircle className="w-4 h-4" />
                        <span>{selectedIds.length} siswa dipilih</span>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={handleClose}>
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleEnroll}
                        isLoading={enrolling}
                        disabled={selectedIds.length === 0 || enrolling}
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Daftarkan {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
