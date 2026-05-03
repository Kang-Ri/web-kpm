'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye, Copy, Trash2, Search, Filter } from 'lucide-react';
import { formService, Form } from '@/lib/api/form.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Button } from '@/components/ui/Button';

export default function FormBuilderPage() {
    const router = useRouter();
    const [templateForms, setTemplateForms] = useState<Form[]>([]);
    const [productForms, setProductForms] = useState<Form[]>([]);

    // Loading states
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    // Pagination for product forms
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setPage(1); // Reset page on search
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Fetch templates whenever search/status change
    useEffect(() => {
        fetchTemplateForms();
    }, [debouncedSearchTerm, statusFilter]);

    // Fetch products whenever search/status/page/limit change
    useEffect(() => {
        fetchProductForms();
    }, [debouncedSearchTerm, statusFilter, page, limit]);

    const fetchTemplateForms = async () => {
        try {
            setLoadingTemplates(true);
            const params: any = { formType: 'template' };
            if (debouncedSearchTerm) params.keyword = debouncedSearchTerm;
            if (statusFilter) params.statusForm = statusFilter;

            const response = await formService.getAll(params);
            const payload = response.data.data as any;
            setTemplateForms(payload?.data || []);
        } catch (error: any) {
            showError(error.message || 'Gagal memuat template form');
        } finally {
            setLoadingTemplates(false);
        }
    };

    const fetchProductForms = async () => {
        try {
            setLoadingProducts(true);
            const params: any = {
                formType: 'product,daftar_ulang',
                page,
                limit
            };
            if (debouncedSearchTerm) params.keyword = debouncedSearchTerm;
            if (statusFilter) params.statusForm = statusFilter;

            const response = await formService.getAll(params);
            const payload = response.data.data as any;

            if (payload?.totalItems !== undefined) {
                setProductForms(payload.data || []);
                setTotalItems(payload.totalItems);
                setTotalPages(payload.totalPages);
            } else {
                setProductForms(payload?.data || []);
                setTotalItems(payload?.data?.length || 0);
                setTotalPages(1);
            }
        } catch (error: any) {
            showError(error.message || 'Gagal memuat product form');
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleDelete = async (idForm: number, namaForm: string) => {
        if (!confirm(`Hapus form "${namaForm}"? Fields akan ikut terhapus.`)) return;

        try {
            await formService.delete(idForm);
            showSuccess('Form berhasil dihapus');
            fetchTemplateForms();
            fetchProductForms();
        } catch (error: any) {
            showError(error.message || 'Gagal menghapus form');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            'Aktif': 'bg-green-100 text-green-800',
            'Non-Aktif': 'bg-gray-100 text-gray-800',
            'Draft': 'bg-yellow-100 text-yellow-800',
        };
        return styles[status as keyof typeof styles] || styles.Draft;
    };

    const renderTable = (formList: Form[], type: 'template' | 'product') => (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">No.</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">NAMA FORM</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">DESKRIPSI</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">FIELDS</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">DIGUNAKAN DI</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">STATUS</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {formList.map((form, index) => (
                        <tr key={form.idForm} className="hover:bg-gray-50">
                            <td className="py-4 px-6 font-medium text-gray-900">{(page - 1) * limit + index + 1}.</td>
                            <td className="py-4 px-6 font-medium text-gray-900">{form.namaForm}</td>
                            <td className="py-4 px-6 text-gray-600 text-sm max-w-md truncate">
                                {form.descForm || '-'}
                            </td>
                            <td className="py-4 px-6 text-gray-600">{form.formfield?.length || 0}</td>
                            <td className="py-4 px-6 text-gray-600">
                                {type === 'template' ? 'Belum digunakan' :
                                    form.formType === 'daftar_ulang' ? 'Daftar Ulang' : 'Produk'}
                            </td>
                            <td className="py-4 px-6">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(form.statusForm)}`}>
                                    {form.statusForm}
                                </span>
                            </td>
                            <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => router.push(`/admin/form-builder/edit/${form.idForm}`)}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                        title="Edit"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(form.idForm, form.namaForm)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Form Builder</h1>
                    <p className="text-sm text-gray-600 mt-1">Kelola template form untuk daftar ulang dan pembelian produk</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => router.push('/admin/form-builder/create')}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Buat Form Baru
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari nama form..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="w-48">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="Aktif">Aktif</option>
                            <option value="Draft">Draft</option>
                            <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Form Templates Section */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-900">Form Templates</h2>
                    <p className="text-sm text-gray-600 mt-1">Template form yang bisa diduplikasi untuk produk</p>
                </div>

                {loadingTemplates ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : templateForms.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Belum ada form template</div>
                ) : (
                    renderTable(templateForms, 'template')
                )}

                {/* Stats */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-3 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        Total Forms: <span className="font-semibold text-gray-900">{templateForms.length}</span>
                    </div>
                </div>
            </div>

            {/* Product Forms Section */}
            <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-blue-50 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Product Forms</h2>
                        <p className="text-sm text-gray-600 mt-1">Form yang terhubung dengan produk/materi</p>
                    </div>
                    {/* Items per page selector */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Tampilkan:</span>
                        <select
                            value={limit}
                            onChange={(e) => {
                                setLimit(Number(e.target.value));
                                setPage(1);
                            }}
                            className="text-sm border border-gray-300 rounded-md py-1.5 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value={10}>10 Baris</option>
                            <option value={50}>50 Baris</option>
                            <option value={100}>100 Baris</option>
                            <option value={200}>200 Baris</option>
                        </select>
                    </div>
                </div>

                {loadingProducts ? (
                    <div className="p-12 text-center text-gray-500">Loading...</div>
                ) : productForms.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Belum ada form produk</div>
                ) : (
                    <>
                        {renderTable(productForms, 'product')}

                        {/* Pagination Controls */}
                        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm text-gray-600">
                                Menampilkan <span className="font-semibold text-gray-900">{(page - 1) * limit + 1}</span> sampai <span className="font-semibold text-gray-900">{Math.min(page * limit, totalItems)}</span> dari <span className="font-semibold text-gray-900">{totalItems}</span> form
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                >
                                    Sebelumnya
                                </Button>
                                <div className="text-sm font-medium px-4 py-1.5 bg-white border border-gray-300 rounded-md">
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
        </div>
    );
}
