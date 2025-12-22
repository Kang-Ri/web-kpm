'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Download, UserPlus, Users } from 'lucide-react';
import { parentProduct2Service, ParentProduct2, CreateParentProduct2Dto } from '@/lib/api/parentProduct2.service';
import { parentProduct1Service } from '@/lib/api/parentProduct1.service';
import { ParentProduct2FormModal } from '@/components/kelas/ParentProduct2FormModal';
import { showSuccess, showError } from '@/lib/utils/toast';

function RuangKelasContent() {
    const params = useParams();
    const router = useRouter();
    const tipe = params.tipe as string; // 'periodik' or 'insidental'
    const idParent1 = parseInt(params.idParent1 as string);

    const [mounted, setMounted] = useState(false);
    const [ruangKelasList, setRuangKelasList] = useState<ParentProduct2[]>([]);
    const [loading, setLoading] = useState(true);
    const [kategoriName, setKategoriName] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRuangKelas, setSelectedRuangKelas] = useState<ParentProduct2 | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && idParent1) {
            fetchKategoriInfo();
            fetchRuangKelas();
        }
    }, [mounted, idParent1]);

    const fetchKategoriInfo = async () => {
        try {
            const response = await parentProduct1Service.getById(idParent1);
            const data = response.data.data || response.data;
            setKategoriName(data.namaParent1);
        } catch (error) {
            console.error('Failed to fetch kategori info:', error);
        }
    };

    const fetchRuangKelas = async () => {
        try {
            setLoading(true);
            const response = await parentProduct2Service.getAll({ idParent1 });
            const data = response.data.data || response.data;
            if (Array.isArray(data)) {
                setRuangKelasList(data);
            }
        } catch (error: any) {
            showError('Gagal memuat data ruang kelas');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setSelectedRuangKelas(null);
        setIsModalOpen(true);
    };

    const handleEdit = (ruangKelas: ParentProduct2) => {
        setSelectedRuangKelas(ruangKelas);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedRuangKelas(null);
    };

    const handleSubmit = async (data: CreateParentProduct2Dto) => {
        try {
            setIsSubmitting(true);

            // Ensure idParent1 and tautanProduk are set
            const tautanProduk = tipe === 'periodik' ? 'Kelas Periodik' : 'Kelas Insidental';
            const submitData = {
                ...data,
                idParent1,
                tautanProduk: tautanProduk as any
            };

            if (selectedRuangKelas) {
                await parentProduct2Service.update(selectedRuangKelas.idParent2, submitData);
                showSuccess('Ruang kelas berhasil diperbarui');
            } else {
                await parentProduct2Service.create(submitData);
                showSuccess('Ruang kelas baru berhasil ditambahkan');
            }

            setIsModalOpen(false);
            fetchRuangKelas();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal menyimpan data ruang kelas');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus ruang kelas ini?')) return;

        try {
            await parentProduct2Service.delete(id);
            showSuccess('Ruang kelas berhasil dihapus');
            fetchRuangKelas();
        } catch (error) {
            showError('Gagal menghapus ruang kelas');
        }
    };

    const handleExportSiswa = async (idParent2: number, namaKelas: string) => {
        try {
            const blob = await parentProduct2Service.exportSiswa(idParent2);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `siswa-${namaKelas}-${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            showSuccess('Data siswa berhasil didownload');
        } catch (error) {
            showError('Gagal mengexport data siswa');
        }
    };

    const handleNavigateBack = () => {
        router.push(`/admin/kelas/${tipe}`);
    };

    if (!mounted) {
        return (
            <div className="space-y-6">
                <div className="text-center py-8 text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <button onClick={handleNavigateBack} className="hover:text-blue-600">
                    Kelas {tipe === 'periodik' ? 'Periodik' : 'Insidental'}
                </button>
                <span>/</span>
                <span className="font-medium text-gray-900">{kategoriName}</span>
                <span>/</span>
                <span className="text-gray-900">Ruang Kelas</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Ruang Kelas - {kategoriName}</h1>
                    <p className="text-gray-600 mt-1">Manajemen ruang kelas dan enrollment siswa</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Tambah Ruang Kelas
                </Button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Ruang Kelas</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{ruangKelasList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Ruang Kelas Aktif</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {ruangKelasList.filter(k => k.status === 'Aktif').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Ruang Kelas Non-Aktif</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {ruangKelasList.filter(k => k.status === 'Non-Aktif').length}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : ruangKelasList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Belum ada ruang kelas</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Ruang Kelas</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tahun Ajaran</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Kapasitas</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Jenjang Kelas</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {ruangKelasList.map((ruangKelas) => (
                                        <tr key={ruangKelas.idParent2} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => router.push(`/admin/kelas/${tipe}/${idParent1}/ruang-kelas/${ruangKelas.idParent2}/materi`)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                                                    title="Lihat Materi"
                                                >
                                                    {ruangKelas.namaParent2}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {ruangKelas.tahunAjaran || '-'}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {ruangKelas.kapasitasMaksimal || 'Unlimited'}
                                            </td>
                                            <td className="py-3 px-4">
                                                {ruangKelas.jenjangKelasIzin && ruangKelas.jenjangKelasIzin.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {ruangKelas.jenjangKelasIzin.map(jenjang => (
                                                            <span key={jenjang} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                                Kelas {jenjang}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500 text-sm">Semua Jenjang</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={ruangKelas.status === 'Aktif' ? 'success' : 'info'}>
                                                    {ruangKelas.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-purple-50 rounded"
                                                        title="Download Data Siswa"
                                                        onClick={() => handleExportSiswa(ruangKelas.idParent2, ruangKelas.namaParent2)}
                                                    >
                                                        <Download className="h-4 w-4 text-purple-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-green-50 rounded"
                                                        title="Tambah Siswa"
                                                    >
                                                        <UserPlus className="h-4 w-4 text-green-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-indigo-50 rounded"
                                                        title="Lihat Siswa"
                                                    >
                                                        <Users className="h-4 w-4 text-indigo-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        onClick={() => handleEdit(ruangKelas)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        onClick={() => handleDelete(ruangKelas.idParent2)}
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
                    )}
                </CardBody>
            </Card>

            {/* Form Modal */}
            <ParentProduct2FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                ruangKelas={selectedRuangKelas}
                isLoading={isSubmitting}
            />
        </div>
    );
}

export default function RuangKelasPage() {
    return (
        <DashboardLayout>
            <RuangKelasContent />
        </DashboardLayout>
    );
}
