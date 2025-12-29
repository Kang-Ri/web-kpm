'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, FileText, Upload, FileUp } from 'lucide-react';
import { productService, Product, CreateProductDto } from '@/lib/api/product.service';
import { parentProduct2Service } from '@/lib/api/parentProduct2.service';
import { parentProduct1Service } from '@/lib/api/parentProduct1.service';
import { ProductFormModal } from '@/components/kelas/ProductFormModal';
import { ImportMateriModal } from '@/components/kelas/ImportMateriModal';
import { BulkImportButtonModal } from '@/components/kelas/BulkImportButtonModal';
import { showSuccess, showError } from '@/lib/utils/toast';

function MateriContent() {
    const params = useParams();
    const router = useRouter();
    const tipe = params.tipe as string;
    const idParent1 = parseInt(params.idParent1 as string);
    const idParent2 = parseInt(params.idParent2 as string);

    const [mounted, setMounted] = useState(false);
    const [materiList, setMateriList] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [ruangKelasName, setRuangKelasName] = useState('');
    const [kategoriName, setKategoriName] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMateri, setSelectedMateri] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Import modal states
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBulkImportButtonModalOpen, setIsBulkImportButtonModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log('🎯 Component Mounted');
        console.log('📍 Route Params:', params);
        console.log('📍 idParent2:', idParent2, 'Type:', typeof idParent2);
    }, []);

    useEffect(() => {
        if (mounted && idParent2 && idParent1) {
            console.log('🚀 Starting data fetch...');
            loadAllData();
        }
    }, [mounted, idParent2, idParent1]);

    const loadAllData = async () => {
        await Promise.all([
            fetchKategoriInfo(),
            fetchRuangKelasInfo(),
            fetchMateri()
        ]);
    };

    const fetchKategoriInfo = async () => {
        try {
            console.log('📍 Fetching kategori for idParent1:', idParent1);
            const response = await parentProduct1Service.getById(idParent1);
            console.log('✅ Kategori Full Response:', response);
            // Backend returns {message: "...", data: {...}}
            // Axios response.data contains the backend response body
            const kategoriData = response.data.data || response.data;
            console.log('✅ Kategori Data:', kategoriData);
            setKategoriName(kategoriData.namaParent1);
        } catch (error) {
            console.error('❌ Failed to fetch kategori info:', error);
        }
    };

    const fetchRuangKelasInfo = async () => {
        try {
            console.log('📍 Fetching ruang kelas for idParent2:', idParent2);
            const response = await parentProduct2Service.getById(idParent2);
            console.log('✅ Ruang Kelas Full Response:', response);
            const ruangKelasData = response.data.data || response.data;
            console.log('✅ Ruang Kelas Data:', ruangKelasData);
            setRuangKelasName(ruangKelasData.namaParent2);
        } catch (error) {
            console.error('❌ Failed to fetch ruang kelas info:', error);
        }
    };

    const fetchMateri = async () => {
        try {
            setLoading(true);
            console.log('🔍 Fetching materi for idParent2:', idParent2);
            // Filter only products with jenisProduk = 'Materi'
            const response = await productService.getAll({
                idParent2,
                jenisProduk: 'Materi'
            });
            console.log('📦 Full Response:', response);
            console.log('📦 Response.data:', response.data);

            // Backend returns { message: "...", data: [...] }
            // Axios already extracts .data, so response.data is the backend response body
            const data = response.data.data || response.data;
            console.log('✅ Extracted Data:', data);
            console.log('✅ Is Array?', Array.isArray(data));
            console.log('✅ Length:', data?.length);

            if (Array.isArray(data)) {
                setMateriList(data);
                console.log('✅ Materi list updated, count:', data.length);
            } else {
                console.error('❌ Data is not an array:', typeof data, data);
                setMateriList([]);
            }
        } catch (error: any) {
            console.error('❌ Fetch Error:', error);
            showError('Gagal memuat data materi');
            setMateriList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateBack = () => {
        router.push(`/admin/kelas/${tipe}/${idParent1}/ruang-kelas`);
    };

    const handleCreate = () => {
        setSelectedMateri(null);
        setIsModalOpen(true);
    };

    const handleEdit = (materi: Product) => {
        setSelectedMateri(materi);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedMateri(null);
    };

    const handleSubmit = async (data: CreateProductDto) => {
        try {
            setIsSubmitting(true);

            // Ensure idParent2 is set
            const submitData = { ...data, idParent2 };

            console.log('🔍 Frontend Submit Data:', submitData);

            if (selectedMateri) {
                console.log('📝 Updating materi ID:', selectedMateri.idProduk);
                const response = await productService.update(selectedMateri.idProduk, submitData);
                console.log('✅ Update Response:', response);
                showSuccess('Materi berhasil diperbarui');
            } else {
                console.log('➕ Creating new materi');
                const response = await productService.create(submitData);
                console.log('✅ Create Response:', response);
                console.log('📦 Created Data:', response.data);
                showSuccess('Materi baru berhasil ditambahkan');
            }

            setIsModalOpen(false);
            console.log('🔄 Refreshing materi list...');
            await fetchMateri();
        } catch (error: any) {
            console.error('❌ Submit Error:', error);
            console.error('📋 Error Response:', error.response);

            // Extract specific error message from backend
            const errorMessage = error.response?.data?.msg
                || error.response?.data?.message
                || 'Gagal menyimpan materi';

            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus materi ini?')) return;

        try {
            await productService.delete(id);
            showSuccess('Materi berhasil dihapus');
            fetchMateri();
        } catch (error) {
            showError('Gagal menghapus materi');
        }
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
                <button onClick={handleNavigateBack} className="hover:text-blue-600">
                    {kategoriName || '...'}
                </button>
                <span>/</span>
                <span className="text-gray-900">{ruangKelasName || '...'}</span>
                <span>/</span>
                <span className="font-medium text-gray-900">Materi</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Materi - {ruangKelasName}</h1>
                    <p className="text-gray-600 mt-1">Manajemen materi pembelajaran</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" icon={FileUp} onClick={() => setIsBulkImportButtonModalOpen(true)}>
                        Import Button
                    </Button>
                    <Button variant="secondary" icon={Upload} onClick={() => setIsImportModalOpen(true)}>
                        Import Excel
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={handleCreate}>
                        Tambah Materi
                    </Button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Materi</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{materiList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Published</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {materiList.filter(m => m.statusProduk === 'Publish').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Draft</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-1">
                            {materiList.filter(m => m.statusProduk === 'Draft').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Non-Aktif</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {materiList.filter(m => m.statusProduk === 'Non-Aktif').length}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : materiList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                            <p>Belum ada materi</p>
                            <p className="text-sm mt-2">Klik "Tambah Materi" untuk mulai membuat konten pembelajaran</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Materi</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Jenis</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Kategori Harga</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Harga Jual</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Auth</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Form</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materiList.map((materi) => (
                                        <tr key={materi.idProduk} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => router.push(`/admin/kelas/${tipe}/${idParent1}/ruang-kelas/${idParent2}/materi/${materi.idProduk}/button`)}
                                                    className="text-blue-600 hover:text-blue-800 font-medium hover:underline text-left"
                                                    title="Kelola Button"
                                                >
                                                    {materi.namaProduk}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="info">
                                                    {materi.jenisProduk}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {materi.kategoriHarga}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {materi.kategoriHarga === 'Bernominal'
                                                    ? `Rp ${materi.hargaJual?.toLocaleString('id-ID') || 0}`
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={materi.authProduk === 'Khusus' ? 'warning' : 'success'}>
                                                    {materi.authProduk}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={materi.statusProduk === 'Publish' ? 'success' : 'warning'}>
                                                    {materi.statusProduk}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {materi.customForm ? (
                                                    <Badge variant="success">✓</Badge>
                                                ) : (
                                                    <Badge variant="warning">-</Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        onClick={() => handleEdit(materi)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    {materi.customForm && materi.idForm && (
                                                        <button
                                                            className="p-2 hover:bg-blue-50 rounded"
                                                            title="Edit Form"
                                                            onClick={() => router.push(`/admin/form-builder/edit/${materi.idForm}`)}
                                                        >
                                                            <FileText className="h-4 w-4 text-blue-600" />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        onClick={() => handleDelete(materi.idProduk)}
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
            <ProductFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                product={selectedMateri}
                isLoading={isSubmitting}
            />

            {/* Import Modal */}
            <ImportMateriModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={fetchMateri}
                idParent2={idParent2}
            />

            {/* Bulk Import Button Modal */}
            <BulkImportButtonModal
                isOpen={isBulkImportButtonModalOpen}
                onClose={() => setIsBulkImportButtonModalOpen(false)}
                onImportComplete={() => {
                    showSuccess('Bulk import button selesai');
                    setIsBulkImportButtonModalOpen(false);
                }}
                idParent2={idParent2}
                materiList={materiList.map(m => ({
                    idProduk: m.idProduk,
                    namaProduk: m.namaProduk
                }))}
            />
        </div >
    );
}

export default function MateriPage() {
    return (
        <DashboardLayout>
            <MateriContent />
        </DashboardLayout>
    );
}
