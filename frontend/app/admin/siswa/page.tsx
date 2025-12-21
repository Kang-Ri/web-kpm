'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Search, Upload, Download, RotateCcw, Trash } from 'lucide-react';
import { siswaService, Siswa, CreateSiswaDto, BulkImportResponse } from '@/lib/api/siswa.service';
import { SiswaFormModal } from '@/components/siswa/SiswaFormModal';
import { BulkImportModal } from '@/components/siswa/BulkImportModal';
import { showSuccess, showError } from '@/lib/utils/toast';

function SiswaListContent() {
    const [mounted, setMounted] = useState(false);
    const [siswaList, setSiswaList] = useState<Siswa[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk operations states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Ensure client-side only rendering
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchSiswa();
        }
    }, [statusFilter, mounted]);

    const fetchSiswa = async () => {
        try {
            setLoading(true);
            const params = statusFilter ? { statusAktif: statusFilter } : undefined;
            const response = await siswaService.getAll(params);
            // setSiswaList(response.data);
            if (response.data && Array.isArray(response.data)) {
                setSiswaList(response.data);
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                setSiswaList(response.data.data);
            }

        } catch (error: any) {
            showError('Gagal memuat data siswa');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedSiswa(null);
        setIsModalOpen(true);
    };

    const handleEdit = (siswa: Siswa) => {
        setSelectedSiswa(siswa);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSiswa(null);
    };

    const handleSubmit = async (data: CreateSiswaDto) => {
        try {
            setIsSubmitting(true);

            // Clean data: convert empty strings to undefined
            const cleanedData = Object.fromEntries(
                Object.entries(data).map(([key, value]) => [
                    key,
                    value === '' ? undefined : value
                ])
            ) as CreateSiswaDto;

            if (selectedSiswa) {
                await siswaService.update(selectedSiswa.idSiswa, cleanedData);
                showSuccess('Data siswa berhasil diperbarui');
            } else {
                await siswaService.create(cleanedData);
                showSuccess('Siswa baru berhasil ditambahkan');
            }

            setIsModalOpen(false);
            fetchSiswa();
        } catch (error: any) {
            showError(error.response?.data?.msg || 'Gagal menyimpan data siswa');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus data siswa ini?')) return;

        try {
            await siswaService.delete(id);
            showSuccess('Data siswa berhasil dihapus');
            fetchSiswa();
        } catch (error) {
            showError('Gagal menghapus data siswa');
        }
    };

    // Bulk Import Handler
    const handleBulkImport = async (file: File): Promise<BulkImportResponse> => {
        try {
            setIsImporting(true);
            const response = await siswaService.bulkImport(file);

            // Handle both possible response structures
            const importResult: BulkImportResponse = (response.data as any).data || response.data as BulkImportResponse;

            if (importResult.success && importResult.success.length > 0) {
                showSuccess(`Berhasil mengimport ${importResult.success.length} siswa`);
                fetchSiswa();
            }

            if (importResult.failed && importResult.failed.length > 0) {
                showError(`${importResult.failed.length} data gagal diimport`);
            }

            return importResult;
        } catch (error: any) {
            console.error('Bulk import error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Gagal mengimport data siswa';
            showError(errorMessage);
            throw error;
        } finally {
            setIsImporting(false);
        }
    };

    // Bulk Delete Handler
    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} siswa yang dipilih?`)) return;

        try {
            const response = await siswaService.bulkDelete(selectedIds);
            showSuccess(`Berhasil menghapus ${response.data.success.length} siswa`);

            if (response.data.failed.length > 0) {
                showError(`${response.data.failed.length} siswa gagal dihapus`);
            }

            setSelectedIds([]);
            fetchSiswa();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal menghapus data siswa');
        }
    };

    // Export Data Handler
    const handleExport = async () => {
        try {
            const blob = await siswaService.exportData();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Data_Siswa_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
            showSuccess('Data siswa berhasil didownload');
        } catch (error) {
            showError('Gagal mendownload data siswa');
        }
    };

    // Reset Password Handler
    const handleResetPassword = async (id: number, namaLengkap: string) => {
        if (!confirm(`Reset password untuk ${namaLengkap} ke default "KPMUser"?`)) return;

        try {
            await siswaService.resetPassword(id);
            showSuccess('Password berhasil direset ke default');
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal mereset password');
        }
    };

    // Selection Handlers
    const handleSelectSiswa = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredSiswa.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSiswa.map(s => s.idSiswa));
        }
    };

    // Filter by search term
    const filteredSiswa = useMemo(() => {
        if (!Array.isArray(siswaList)) return [];

        return siswaList.filter((siswa) => {
            const search = searchTerm.toLowerCase();
            return (
                siswa.namaLengkap?.toLowerCase().includes(search) ||
                siswa.email?.toLowerCase().includes(search) ||
                siswa.nisn?.toLowerCase().includes(search)
            );
        });
    }, [siswaList, searchTerm]);

    // Prevent hydration mismatch by ensuring client-side only rendering
    if (!mounted) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8 text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Data Siswa</h1>
                    <p className="text-gray-600 mt-1">Kelola data siswa dan informasi terkait</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" icon={Upload} onClick={() => setIsBulkImportOpen(true)}>
                        Import Excel
                    </Button>
                    <Button variant="secondary" icon={Download} onClick={handleExport}>
                        Download Data
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={handleCreate}>
                        Tambah Siswa
                    </Button>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-900 font-medium">
                            {selectedIds.length} siswa dipilih
                        </span>
                    </div>
                    <Button
                        variant="danger"
                        icon={Trash}
                        onClick={handleBulkDelete}
                        size="sm"
                    >
                        Hapus yang Dipilih
                    </Button>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Siswa</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{siswaList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Siswa Aktif</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {siswaList.filter(s => s.statusAktif === 'Aktif').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Siswa Non-Aktif</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {

                                siswaList.filter(s => s.statusAktif === 'Non-Aktif').length
                            }
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    <div className="space-y-4">
                        {/* Search and Filter */}
                        <div className="flex items-center gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, atau NISN..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    suppressHydrationWarning
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Status</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : filteredSiswa.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Tidak ada data siswa</div>
                        ) : (
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.length === filteredSiswa.length && filteredSiswa.length > 0}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">NISN</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Lengkap</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Email</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">No HP</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Jenis Kelamin</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSiswa.map((siswa) => (
                                        <tr
                                            key={siswa.idSiswa}
                                            className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIds.includes(siswa.idSiswa) ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <td className="py-3 px-4">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(siswa.idSiswa)}
                                                    onChange={() => handleSelectSiswa(siswa.idSiswa)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="py-3 px-4">{siswa.nisn || '-'}</td>
                                            <td className="py-3 px-4">{siswa.namaLengkap}</td>
                                            <td className="py-3 px-4">{siswa.email || '-'}</td>
                                            <td className="py-3 px-4">{siswa.noHp || '-'}</td>
                                            <td className="py-3 px-4">{siswa.jenisKelamin || '-'}</td>
                                            <td className="py-3 px-4">
                                                <Badge variant={siswa.statusAktif === 'Aktif' ? 'success' : 'info'}>
                                                    {siswa.statusAktif}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        onClick={() => handleEdit(siswa)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-orange-50 rounded"
                                                        title="Reset Password"
                                                        onClick={() => handleResetPassword(siswa.idSiswa, siswa.namaLengkap)}
                                                    >
                                                        <RotateCcw className="h-4 w-4 text-orange-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        onClick={() => handleDelete(siswa.idSiswa)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </CardBody>
            </Card>

            {/* Siswa Form Modal */}
            <SiswaFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                siswa={selectedSiswa}
                isLoading={isSubmitting}
            />

            {/* Bulk Import Modal */}
            <BulkImportModal
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onImport={handleBulkImport}
                isLoading={isImporting}
            />
        </div>
    );
}

export default function SiswaPage() {
    return (
        <DashboardLayout>
            <SiswaListContent />
        </DashboardLayout>
    );
}
