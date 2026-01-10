'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { parentProduct1Service, ParentProduct1, CreateParentProduct1Dto } from '@/lib/api/parentProduct1.service';
import { mediaService, Media } from '@/lib/api/media.service';
import { ParentProduct1FormModal } from '@/components/kelas/ParentProduct1FormModal';
import { showSuccess, showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';

function KelasInsidentalContent() {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [kategoriList, setKategoriList] = useState<ParentProduct1[]>([]);
    const [loading, setLoading] = useState(true);
    const [mediaMap, setMediaMap] = useState<Record<number, Media | null>>({});

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKategori, setSelectedKategori] = useState<ParentProduct1 | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            fetchKategori();
        }
    }, [mounted]);

    const fetchKategori = async () => {
        try {
            setLoading(true);
            const response = await parentProduct1Service.getAll({ tautanProduk: 'Kelas Insidental' });
            const data = (response as any).data?.data || (response as any).data || [];
            if (Array.isArray(data)) {
                setKategoriList(data);
                fetchMediaForCategories(data);
            }
        } catch (error: any) {
            showError('Gagal memuat data kategori kelas');
        } finally {
            setLoading(false);
        }
    };

    const fetchMediaForCategories = async (categories: ParentProduct1[]) => {
        const mediaPromises = categories.map(async (kategori) => {
            try {
                const response = await mediaService.getPrimaryMedia('parent1', kategori.idParent1);
                const backendResponse = response.data as any;
                const media = backendResponse?.data || null;
                return { id: kategori.idParent1, media };
            } catch (error) {
                return { id: kategori.idParent1, media: null };
            }
        });

        const results = await Promise.all(mediaPromises);
        const newMediaMap: Record<number, Media | null> = {};
        results.forEach(result => {
            newMediaMap[result.id] = result.media;
        });
        setMediaMap(newMediaMap);
    };

    const handleCreate = () => {
        setSelectedKategori(null);
        setIsModalOpen(true);
    };

    const handleEdit = (kategori: ParentProduct1) => {
        setSelectedKategori(kategori);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedKategori(null);
    };

    const handleSubmit = async (data: CreateParentProduct1Dto) => {
        try {
            setIsSubmitting(true);

            // Set tautanProduk to Kelas Insidental
            const submitData = { ...data, tautanProduk: 'Kelas Insidental' as const };

            let entityId: number;

            if (selectedKategori) {
                await parentProduct1Service.update(selectedKategori.idParent1, submitData);
                entityId = selectedKategori.idParent1;
                showSuccess('Kategori kelas berhasil diperbarui');
            } else {
                const response = await parentProduct1Service.create(submitData);
                entityId = response.data.idParent1;
                showSuccess('Kategori kelas baru berhasil ditambahkan');
            }

            // Auto-link uploaded media to the entity (both CREATE and UPDATE)
            const uploadedMediaIds = (window as any).__uploadedMediaIds || [];
            if (uploadedMediaIds.length > 0) {
                try {
                    // If updating, delete old media first to replace instead of add
                    if (selectedKategori) {
                        try {
                            const oldMediaResponse = await mediaService.getMediaByEntity('parent1', entityId);
                            const oldMedia = (oldMediaResponse.data as any)?.data || [];

                            for (const media of oldMedia) {
                                await mediaService.deleteMedia(media.idMedia);
                            }
                        } catch (err) {
                            console.error('Failed to delete old media:', err);
                        }
                    }

                    // Link new media
                    for (const mediaId of uploadedMediaIds) {
                        await mediaService.linkToEntity(mediaId, entityId);
                    }

                    (window as any).__uploadedMediaIds = [];
                } catch (linkError) {
                    console.error('Failed to link media:', linkError);
                }
            }

            setIsModalOpen(false);
            fetchKategori();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal menyimpan data kategori');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus kategori kelas ini?')) return;

        try {
            await parentProduct1Service.delete(id);
            showSuccess('Kategori kelas berhasil dihapus');
            fetchKategori();
        } catch (error) {
            showError('Gagal menghapus kategori kelas');
        }
    };

    const handleNavigateToRuangKelas = (idParent1: number, namaParent1: string) => {
        router.push(`/admin/kelas/insidental/${idParent1}/ruang-kelas`);
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Kelas Insidental</h1>
                    <p className="text-gray-600 mt-1">Manajemen kategori kelas insidental</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Tambah Kategori
                </Button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Kategori</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{kategoriList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Kategori Aktif</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {kategoriList.filter(k => k.status === 'Aktif').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Kategori Non-Aktif</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {kategoriList.filter(k => k.status === 'Non-Aktif').length}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : kategoriList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Tidak ada data kategori</div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Thumbnail</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Kategori</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal Publish</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kategoriList.map((kategori) => {
                                    const media = mediaMap[kategori.idParent1];
                                    const thumbnailUrl = media?.fileUrl
                                        ? (media.fileUrl.startsWith('http') ? media.fileUrl : `http://localhost:5000/${media.fileUrl}`)
                                        : null;

                                    return (
                                        <tr key={kategori.idParent1} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                    {thumbnailUrl ? (
                                                        <img
                                                            src={thumbnailUrl}
                                                            alt={kategori.namaParent1}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleNavigateToRuangKelas(kategori.idParent1, kategori.namaParent1)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                                                >
                                                    {kategori.namaParent1}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={kategori.status === 'Aktif' ? 'success' : 'info'}>
                                                    {kategori.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {kategori.tglPublish
                                                    ? new Date(kategori.tglPublish).toLocaleDateString('id-ID')
                                                    : '-'
                                                }
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-green-50 rounded"
                                                        title="Lihat Ruang Kelas"
                                                        onClick={() => handleNavigateToRuangKelas(kategori.idParent1, kategori.namaParent1)}
                                                    >
                                                        <FolderOpen className="h-4 w-4 text-green-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        onClick={() => handleEdit(kategori)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        onClick={() => handleDelete(kategori.idParent1)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </CardBody>
            </Card>

            {/* Form Modal */}
            <ParentProduct1FormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                kategori={selectedKategori}
                isLoading={isSubmitting}
            />
        </div>
    );
}

export default function KelasInsidentalPage() {
    return (
        <DashboardLayout>
            <KelasInsidentalContent />
        </DashboardLayout>
    );
}
