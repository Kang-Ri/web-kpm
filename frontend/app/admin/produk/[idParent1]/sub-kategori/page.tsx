'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { parentProduct2Service, ParentProduct2, CreateParentProduct2Dto } from '@/lib/api/parentProduct2.service';
import { parentProduct1Service } from '@/lib/api/parentProduct1.service';
import { mediaService, Media } from '@/lib/api/media.service';
import { ProductSubKategoriFormModal } from '@/components/produk/ProductSubKategoriFormModal';
import { showSuccess, showError } from '@/lib/utils/toast';

function SubKategoriContent() {
    const params = useParams();
    const router = useRouter();
    const idParent1 = parseInt(params.idParent1 as string);

    const [mounted, setMounted] = useState(false);
    const [subKategoriList, setSubKategoriList] = useState<ParentProduct2[]>([]);
    const [loading, setLoading] = useState(true);
    const [kategoriName, setKategoriName] = useState('');
    const [mediaMap, setMediaMap] = useState<Record<number, Media | null>>({});

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSubKategori, setSelectedSubKategori] = useState<ParentProduct2 | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && idParent1) {
            fetchKategoriInfo();
            fetchSubKategori();
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

    const fetchSubKategori = async () => {
        try {
            setLoading(true);
            const response = await parentProduct2Service.getAll({ idParent1 });
            const data = (response as any).data?.data || (response as any).data || [];
            if (Array.isArray(data)) {
                setSubKategoriList(data);
                fetchMediaForSubKategori(data);
            }
        } catch (error: any) {
            showError('Gagal memuat data sub-kategori');
        } finally {
            setLoading(false);
        }
    };

    const fetchMediaForSubKategori = async (subKategories: ParentProduct2[]) => {
        const mediaPromises = subKategories.map(async (subKategori) => {
            try {
                const response = await mediaService.getPrimaryMedia('parent2', subKategori.idParent2);
                const backendResponse = response.data as any;
                const media = backendResponse?.data || null;
                return { id: subKategori.idParent2, media };
            } catch (error) {
                return { id: subKategori.idParent2, media: null };
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
        setSelectedSubKategori(null);
        setIsModalOpen(true);
    };

    const handleEdit = (subKategori: ParentProduct2) => {
        setSelectedSubKategori(subKategori);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSubKategori(null);
    };

    const handleSubmit = async (data: CreateParentProduct2Dto) => {
        try {
            setIsSubmitting(true);

            // Auto-set tautanProduk to 'Produk Komersial'
            const submitData = {
                ...data,
                idParent1,
                tautanProduk: 'Produk Komersial' as any
            };

            let entityId: number;

            if (selectedSubKategori) {
                await parentProduct2Service.update(selectedSubKategori.idParent2, submitData);
                entityId = selectedSubKategori.idParent2;
                showSuccess('Sub-kategori berhasil diperbarui');
            } else {
                const response = await parentProduct2Service.create(submitData);
                console.log('✅ CREATE RESPONSE:', response);
                console.log('✅ response.data:', response.data);
                entityId = response.data.idParent2;
                console.log('✅ entityId extracted:', entityId);
                showSuccess('Sub-kategori baru berhasil ditambahkan');
            }

            // Auto-link uploaded media to the entity (both CREATE and UPDATE)
            const uploadedMediaIds = (window as any).__uploadedMediaIds || [];
            console.log('📦 uploadedMediaIds:', uploadedMediaIds);
            console.log('🔑 Final entityId for linking:', entityId);
            if (uploadedMediaIds.length > 0) {
                try {
                    // If updating, delete old media first to replace instead of add
                    if (selectedSubKategori) {
                        try {
                            const oldMediaResponse = await mediaService.getMediaByEntity('parent2', entityId);
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
                        console.log(`🔗 Linking mediaId ${mediaId} to entityId ${entityId}`);
                        await mediaService.linkToEntity(mediaId, entityId);
                    }

                    (window as any).__uploadedMediaIds = [];
                } catch (linkError) {
                    console.error('Failed to link media:', linkError);
                }
            }

            setIsModalOpen(false);
            fetchSubKategori();
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal menyimpan data sub-kategori');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus sub-kategori ini?')) return;

        try {
            await parentProduct2Service.delete(id);
            showSuccess('Sub-kategori berhasil dihapus');
            fetchSubKategori();
        } catch (error) {
            showError('Gagal menghapus sub-kategori');
        }
    };

    const handleNavigateBack = () => {
        router.push('/admin/produk');
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
                    Manajemen Produk
                </button>
                <span>/</span>
                <span className="font-medium text-gray-900">{kategoriName || '...'}</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Sub-Kategori - {kategoriName}</h1>
                    <p className="text-gray-600 mt-1">Manajemen sub-kategori produk</p>
                </div>
                <Button variant="primary" icon={Plus} onClick={handleCreate}>
                    Tambah Sub-Kategori
                </Button>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Sub-Kategori</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{subKategoriList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Aktif</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {subKategoriList.filter(k => k.status === 'Aktif').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Non-Aktif</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {subKategoriList.filter(k => k.status === 'Non-Aktif').length}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : subKategoriList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Belum ada sub-kategori</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Thumbnail</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Sub-Kategori</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tanggal Publish</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subKategoriList.map((subKategori) => {
                                        const media = mediaMap[subKategori.idParent2];
                                        const thumbnailUrl = media?.fileUrl
                                            ? (media.fileUrl.startsWith('http') ? media.fileUrl : `http://localhost:5000/${media.fileUrl}`)
                                            : null;

                                        return (
                                            <tr key={subKategori.idParent2} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                                                        {thumbnailUrl ? (
                                                            <img
                                                                src={thumbnailUrl}
                                                                alt={subKategori.namaParent2}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <ImageIcon className="h-8 w-8 text-gray-400" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => router.push(`/admin/produk/${idParent1}/sub-kategori/${subKategori.idParent2}/item`)}
                                                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-2"
                                                        title="Lihat Item Produk"
                                                    >
                                                        <FolderOpen className="h-4 w-4" />
                                                        {subKategori.namaParent2}
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={subKategori.status === 'Aktif' ? 'success' : 'info'}>
                                                        {subKategori.status}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {subKategori.tglPublish
                                                        ? new Date(subKategori.tglPublish).toLocaleDateString('id-ID')
                                                        : '-'
                                                    }
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            className="p-2 hover:bg-blue-50 rounded"
                                                            title="Edit"
                                                            onClick={() => handleEdit(subKategori)}
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-600" />
                                                        </button>
                                                        <button
                                                            className="p-2 hover:bg-red-50 rounded"
                                                            title="Delete"
                                                            onClick={() => handleDelete(subKategori.idParent2)}
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
                        </div>
                    )}
                </CardBody>
            </Card>

            {/* Form Modal */}
            <ProductSubKategoriFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                subKategori={selectedSubKategori}
                isLoading={isSubmitting}
            />
        </div>
    );
}

export default function SubKategoriPage() {
    return (
        <DashboardLayout>
            <SubKategoriContent />
        </DashboardLayout>
    );
}
