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
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Pagination states
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSiswa, setSelectedSiswa] = useState<Siswa | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk operations states
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Ensure client-side only rendering
    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchSiswa();
        }
    }, [statusFilter, debouncedSearchTerm, page, limit, mounted]);

    const fetchSiswa = async () => {
        try {
            setLoading(true);
            const params: any = { page, limit };
            if (statusFilter) params.statusAktif = statusFilter;
            if (debouncedSearchTerm) params.search = debouncedSearchTerm;

            const response = await siswaService.getAll(params);
            const result = response.data as any; // Due to PaginatedSiswaResponse

            if (result && Array.isArray(result.data)) {
                setSiswaList(result.data);
                setTotalItems(result.totalItems || 0);
                setTotalPages(result.totalPages || 1);
            } else if (result?.data && Array.isArray(result.data.data)) {
                // Handling nested data just in case
                setSiswaList(result.data.data);
                setTotalItems(result.data.totalItems || 0);
                setTotalPages(result.data.totalPages || 1);
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
        if (selectedIds.length === siswaList.length && siswaList.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(siswaList.map(s => s.idSiswa));
        }
    };

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
                        <p className="text-sm text-gray-600">Total Siswa (Keseluruhan)</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
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
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Semua Status</option>
                                <option value="Aktif">Aktif</option>
                                <option value="Non-Aktif">Non-Aktif</option>
                            </select>
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value={10}>10 Baris</option>
                                <option value={50}>50 Baris</option>
                                <option value={100}>100 Baris</option>
                                <option value={200}>200 Baris</option>
                            </select>
                        </div>

                        {/* Table */}
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Loading...</div>
                        ) : siswaList.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Tidak ada data siswa</div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-200 bg-gray-50">
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700 w-12">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.length === siswaList.length && siswaList.length > 0}
                                                        onChange={handleSelectAll}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                </th>
                                                <th className="text-left py-3 px-4 font-semibold text-gray-700">No</th>
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
                                            {siswaList.map((siswa, index) => (
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
                                                    <td className="py-3 px-4">{index + 1}</td>
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
                                </div>

                                {/* Pagination Controls */}
                                <div className="flex items-center justify-between mt-4 py-3 border-t border-gray-100">
                                    <div className="text-sm text-gray-500">
                                        Menampilkan <span className="font-medium">{(page - 1) * limit + 1}</span> sampai <span className="font-medium">{Math.min(page * limit, totalItems)}</span> dari <span className="font-medium">{totalItems}</span> siswa
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={page === 1}
                                            onClick={() => setPage(p => Math.max(1, p - 1))}
                                        >
                                            Sebelumnya
                                        </Button>
                                        <div className="text-sm font-medium px-4 py-1.5 bg-gray-100 rounded-md">
                                            Halaman {page} / {totalPages}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            disabled={page >= totalPages}
                                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        >
                                            Selanjutnya
                                        </Button>
                                    </div>
                                </div>
                            </>
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
