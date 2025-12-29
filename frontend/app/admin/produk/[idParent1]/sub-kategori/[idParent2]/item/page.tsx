'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Plus, Edit, Trash2, Upload } from 'lucide-react';
import { productService, Product, CreateProductDto } from '@/lib/api/product.service';
import { parentProduct2Service } from '@/lib/api/parentProduct2.service';
import { parentProduct1Service } from '@/lib/api/parentProduct1.service';
import { ProductItemFormModal } from '@/components/produk/ProductItemFormModal';
import { ImportMateriModal } from '@/components/kelas/ImportMateriModal';
import { showSuccess, showError } from '@/lib/utils/toast';

function ItemProdukContent() {
    const params = useParams();
    const router = useRouter();
    const idParent1 = parseInt(params.idParent1 as string);
    const idParent2 = parseInt(params.idParent2 as string);

    const [mounted, setMounted] = useState(false);
    const [itemList, setItemList] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [subKategoriName, setSubKategoriName] = useState('');
    const [kategoriName, setKategoriName] = useState('');

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Product | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted && idParent2 && idParent1) {
            loadAllData();
        }
    }, [mounted, idParent2, idParent1]);

    const loadAllData = async () => {
        await Promise.all([
            fetchKategoriInfo(),
            fetchSubKategoriInfo(),
            fetchItems()
        ]);
    };

    const fetchKategoriInfo = async () => {
        try {
            const response = await parentProduct1Service.getById(idParent1);
            const kategoriData = response.data.data || response.data;
            setKategoriName(kategoriData.namaParent1);
        } catch (error) {
            console.error('Failed to fetch kategori info:', error);
        }
    };

    const fetchSubKategoriInfo = async () => {
        try {
            const response = await parentProduct2Service.getById(idParent2);
            const subKategoriData = response.data.data || response.data;
            setSubKategoriName(subKategoriData.namaParent2);
        } catch (error) {
            console.error('Failed to fetch sub-kategori info:', error);
        }
    };

    const fetchItems = async () => {
        try {
            setLoading(true);
            // Get all products for this sub-kategori (no jenisProduk filter for Produk Komersial)
            const response = await productService.getAll({ idParent2 });
            const data = response.data.data || response.data;

            if (Array.isArray(data)) {
                setItemList(data);
            } else {
                setItemList([]);
            }
        } catch (error: any) {
            showError('Gagal memuat data item produk');
            setItemList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateBack = () => {
        router.push(`/admin/produk/${idParent1}/sub-kategori`);
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Product) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const handleSubmit = async (data: CreateProductDto) => {
        try {
            setIsSubmitting(true);

            const submitData = { ...data, idParent2 };

            if (selectedItem) {
                await productService.update(selectedItem.idProduk, submitData);
                showSuccess('Item produk berhasil diperbarui');
            } else {
                await productService.create(submitData);
                showSuccess('Item produk baru berhasil ditambahkan');
            }

            setIsModalOpen(false);
            await fetchItems();
        } catch (error: any) {
            const errorMessage = error.response?.data?.msg
                || error.response?.data?.message
                || 'Gagal menyimpan item produk';

            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Apakah Anda yakin ingin menghapus item produk ini?')) return;

        try {
            await productService.delete(id);
            showSuccess('Item produk berhasil dihapus');
            fetchItems();
        } catch (error) {
            showError('Gagal menghapus item produk');
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
                <button onClick={() => router.push('/admin/produk')} className="hover:text-blue-600">
                    Manajemen Produk
                </button>
                <span>/</span>
                <button onClick={handleNavigateBack} className="hover:text-blue-600">
                    {kategoriName || '...'}
                </button>
                <span>/</span>
                <span className="font-medium text-gray-900">{subKategoriName || '...'}</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Item Produk - {subKategoriName}</h1>
                    <p className="text-gray-600 mt-1">Manajemen produk individual</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" icon={Upload} onClick={() => setIsImportModalOpen(true)}>
                        Import Excel
                    </Button>
                    <Button variant="primary" icon={Plus} onClick={handleCreate}>
                        Tambah Item
                    </Button>
                </div>
            </div>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Total Item</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{itemList.length}</p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Published</p>
                        <p className="text-3xl font-bold text-green-600 mt-1">
                            {itemList.filter(m => m.statusProduk === 'Publish').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Draft</p>
                        <p className="text-3xl font-bold text-yellow-600 mt-1">
                            {itemList.filter(m => m.statusProduk === 'Draft').length}
                        </p>
                    </CardBody>
                </Card>
                <Card>
                    <CardBody>
                        <p className="text-sm text-gray-600">Non-Aktif</p>
                        <p className="text-3xl font-bold text-gray-600 mt-1">
                            {itemList.filter(m => m.statusProduk === 'Non-Aktif').length}
                        </p>
                    </CardBody>
                </Card>
            </div>

            {/* Table Card */}
            <Card>
                <CardBody>
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">Loading...</div>
                    ) : itemList.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            Belum ada item produk
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-200">
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Nama Produk</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Jenis</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Kategori Harga</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Harga Jual</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Auth</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemList.map((item) => (
                                        <tr key={item.idProduk} className="border-b border-gray-100 hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-gray-900">
                                                {item.namaProduk}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="info">
                                                    {item.jenisProduk}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {item.kategoriHarga}
                                            </td>
                                            <td className="py-3 px-4 text-gray-600">
                                                {item.kategoriHarga === 'Bernominal'
                                                    ? `Rp ${item.hargaJual?.toLocaleString('id-ID') || 0}`
                                                    : '-'}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={item.authProduk === 'Khusus' ? 'warning' : 'success'}>
                                                    {item.authProduk}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={item.statusProduk === 'Publish' ? 'success' : 'warning'}>
                                                    {item.statusProduk}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="p-2 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                        onClick={() => handleEdit(item)}
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </button>
                                                    <button
                                                        className="p-2 hover:bg-red-50 rounded"
                                                        title="Delete"
                                                        onClick={() => handleDelete(item.idProduk)}
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
            <ProductItemFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSubmit={handleSubmit}
                product={selectedItem}
                isLoading={isSubmitting}
            />

            {/* Import Modal */}
            <ImportMateriModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportComplete={fetchItems}
                idParent2={idParent2}
            />
        </div>
    );
}

export default function ItemProdukPage() {
    return (
        <DashboardLayout>
            <ItemProdukContent />
        </DashboardLayout>
    );
}
