'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Link as LinkIcon, Calendar, Clock, Download, Eye } from 'lucide-react';
import { materiButtonService, MateriButton, CreateMateriButtonDto } from '@/lib/api/materiButton.service';
import { productService } from '@/lib/api/product.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { MateriButtonFormModal } from '@/components/kelas/MateriButtonFormModal';
import { SiswaListModal } from '@/components/kelas/SiswaListModal';

function ButtonContent() {
    const params = useParams();
    const router = useRouter();
    const tipe = params.tipe as string;
    const idParent1 = parseInt(params.idParent1 as string);
    const idParent2 = parseInt(params.idParent2 as string);
    const idProduk = parseInt(params.idProduk as string);

    const [mounted, setMounted] = useState(false);
    const [buttonList, setButtonList] = useState<MateriButton[]>([]);
    const [loading, setLoading] = useState(true);
    const [materiName, setMateriName] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedButton, setSelectedButton] = useState<MateriButton | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Siswa modal state
    const [isSiswaModalOpen, setIsSiswaModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && idProduk) {
            loadAllData();
        }
    }, [mounted, idProduk]);

    const loadAllData = async () => {
        await Promise.all([
            fetchMateriInfo(),
            fetchButtons()
        ]);
    };

    const fetchMateriInfo = async () => {
        try {
            const response = await productService.getById(idProduk);
            const data = response.data.data || response.data;
            setMateriName(data.namaProduk);
        } catch (error) {
            console.error('Failed to fetch materi info:', error);
        }
    };

    const fetchButtons = async () => {
        try {
            setLoading(true);
            const response = await materiButtonService.getAll({ idProduk });
            const data = response.data.data || response.data;
            if (Array.isArray(data)) {
                setButtonList(data);
            }
        } catch (error: any) {
            showError('Gagal memuat data button');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (data: CreateMateriButtonDto) => {
        try {
            setIsSubmitting(true);
            const submitData = { ...data, idProduk };

            if (selectedButton) {
                await materiButtonService.update(selectedButton.idButton, submitData);
                showSuccess('Button berhasil diperbarui');
            } else {
                await materiButtonService.create(submitData);
                showSuccess('Button baru berhasil ditambahkan');
            }

            setIsModalOpen(false);
            await fetchButtons();
        } catch (error: any) {
            const errorMessage = error.response?.data?.msg
                || error.response?.data?.message
                || 'Gagal menyimpan button';
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenModal = () => {
        setSelectedButton(null);
        setIsModalOpen(true);
    };

    const handleEditButton = (button: MateriButton) => {
        setSelectedButton(button);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedButton(null);
    };

    const handleNavigateBack = () => {
        router.push(`/admin/kelas/${tipe}/${idParent1}/ruang-kelas/${idParent2}/materi`);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus button ini?')) return;

        try {
            await materiButtonService.delete(id);
            showSuccess('Button berhasil dihapus');
            fetchButtons();
        } catch (error) {
            showError('Gagal menghapus button');
        }
    };

    const handleDownloadSiswa = () => {
        const token = localStorage.getItem('token');
        const url = `/api/v1/cms/materi/${idProduk}/siswa/export?materiName=${encodeURIComponent(materiName)}`;

        fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            }
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `siswa-${materiName}-${Date.now()}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            })
            .catch(error => {
                console.error('Download failed:', error);
                showError('Gagal download data siswa');
            });
    };

    const handleViewSiswa = () => {
        setIsSiswaModalOpen(true);
    };

    const isScheduled = (button: MateriButton) => {
        if (!button.tanggalPublish) return false;
        const publishDate = new Date(button.tanggalPublish);
        return publishDate > new Date();
    };

    const isExpired = (button: MateriButton) => {
        if (!button.tanggalExpire) return false;
        const expireDate = new Date(button.tanggalExpire);
        return expireDate < new Date();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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
                <button onClick={() => router.push(`/admin/kelas/${tipe}`)} className="hover:text-blue-600">
                    Kelas {tipe === 'periodik' ? 'Periodik' : 'Insidental'}
                </button>
                <span>/</span>
                <button onClick={() => router.push(`/admin/kelas/${tipe}/${idParent1}/ruang-kelas`)} className="hover:text-blue-600">
                    Ruang Kelas
                </button>
                <span>/</span>
                <button onClick={handleNavigateBack} className="hover:text-blue-600">
                    {materiName || '...'}
                </button>
                <span>/</span>
                <span className="font-medium text-gray-900">Button</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Button - {materiName}</h1>
                    <p className="text-gray-600 mt-1">Manajemen button dan konten materi</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="secondary"
                        icon={Download}
                        onClick={handleDownloadSiswa}
                    >
                        Download Siswa
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={handleOpenModal}>
                        Tambah Button
                    </Button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Button</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{buttonList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Active</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {buttonList.filter(b => b.statusButton === 'Active' && !isExpired(b)).length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Scheduled</p>
                        <p className="text-3xl font-bold text-blue-600 mt-1">
                            {buttonList.filter(b => isScheduled(b)).length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Expired</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {buttonList.filter(b => isExpired(b)).length}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : buttonList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <LinkIcon className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p>Belum ada button</p>
                            <p className="text-sm mt-2">Klik "Tambah Button" untuk menambahkan link atau konten</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">#</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Judul</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Button</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Link Tujuan</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal Publish</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal Expire</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {buttonList.map((button, index) => (
                                        <tr key={button.idButton} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-600">
                                                {index + 1}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {button.judulButton || '-'}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                {button.namaButton}
                                            </td>
                                            <td className="py-3 px-4">
                                                <a
                                                    href={button.linkTujuan}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:underline flex items-center gap-1"
                                                >
                                                    <LinkIcon className="h-3 w-3" />
                                                    <span className="truncate max-w-xs">{button.linkTujuan}</span>
                                                </a>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 text-sm">
                                                {button.tanggalPublish && (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(button.tanggalPublish)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 text-sm">
                                                {button.tanggalExpire && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDate(button.tanggalExpire)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant={
                                                        isExpired(button) ? 'secondary' :
                                                            isScheduled(button) ? 'info' :
                                                                button.statusButton === 'Active' ? 'success' : 'warning'
                                                    }
                                                >
                                                    {isExpired(button) ? 'Expired' :
                                                        isScheduled(button) ? 'Scheduled' :
                                                            button.statusButton}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-green-50 rounded"
                                                        title="Lihat Siswa"
                                                        onClick={handleViewSiswa}
                                                    >
                                                        <Eye className="h-4 w-4 text-green-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        onClick={() => handleEditButton(button)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        onClick={() => handleDelete(button.idButton)}
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

            {/* Modal */}
            <MateriButtonFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                button={selectedButton}
                isLoading={isSubmitting}
            />

            {/* Siswa List Modal */}
            <SiswaListModal
                isOpen={isSiswaModalOpen}
                onClose={() => setIsSiswaModalOpen(false)}
                idProduk={idProduk}
                materiName={materiName}
            />
        </div>
    );
}

export default function ButtonPage() {
    return (
        <DashboardLayout>
            <ButtonContent />
        </DashboardLayout>
    );
}
