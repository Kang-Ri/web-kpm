'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Eye, Copy, Trash2, Search, Filter } from 'lucide-react';
import { formService, Form } from '@/lib/api/form.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { Button } from '@/components/ui/Button';

export default function FormBuilderPage() {
    const router = useRouter();
    const [forms, setForms] = useState<Form[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');

    useEffect(() => {
        fetchForms();
    }, []);

    const fetchForms = async () => {
        try {
            setLoading(true);
            const response = await formService.getAll();
            setForms(response.data.data || []);
        } catch (error: any) {
            showError(error.message || 'Gagal memuat data form');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (idForm: number, namaForm: string) => {
        if (!confirm(`Hapus form "${namaForm}"? Fields akan ikut terhapus.`)) return;

        try {
            await formService.delete(idForm);
            showSuccess('Form berhasil dihapus');
            fetchForms();
        } catch (error: any) {
            showError(error.message || 'Gagal menghapus form');
        }
    };

    const filteredForms = forms.filter(form => {
        const matchesSearch = form.namaForm.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || form.statusForm === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        const styles = {
            'Aktif': 'bg-green-100 text-green-800',
            'Non-Aktif': 'bg-gray-100 text-gray-800',
            'Draft': 'bg-yellow-100 text-yellow-800',
        };
        return styles[status as keyof typeof styles] || styles.Draft;
    };

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

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Nama Form</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Deskripsi</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Fields</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Digunakan di</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : filteredForms.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        Belum ada form. Klik "Buat Form Baru" untuk memulai.
                                    </td>
                                </tr>
                            ) : (
                                filteredForms.map((form) => (
                                    <tr key={form.idForm} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{form.namaForm}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600 max-w-md truncate">
                                                {form.descForm || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">
                                                {form.fields?.length || 0} field(s)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">
                                                {form.products && form.products.length > 0
                                                    ? `${form.products.length} produk`
                                                    : 'Belum digunakan'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(form.statusForm)}`}>
                                                {form.statusForm}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => router.push(`/admin/form-builder/edit/${form.idForm}`)}
                                                    className="p-2 hover:bg-blue-50 rounded text-blue-600"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/admin/form-builder/preview/${form.idForm}`)}
                                                    className="p-2 hover:bg-gray-100 rounded text-gray-600"
                                                    title="Preview"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(form.idForm, form.namaForm)}
                                                    className="p-2 hover:bg-red-50 rounded text-red-600"
                                                    title="Hapus"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">Total Forms</div>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{forms.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">Aktif</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                        {forms.filter(f => f.statusForm === 'Aktif').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">Draft</div>
                    <div className="text-2xl font-bold text-yellow-600 mt-1">
                        {forms.filter(f => f.statusForm === 'Draft').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600">Non-Aktif</div>
                    <div className="text-2xl font-bold text-gray-600 mt-1">
                        {forms.filter(f => f.statusForm === 'Non-Aktif').length}
                    </div>
                </div>
            </div>
        </div>
    );
}
