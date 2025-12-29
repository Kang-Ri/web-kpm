import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Product, CreateProductDto } from '@/lib/api/product.service';
import { FormTemplateSelector } from '@/components/admin/FormTemplateSelector';
import { formService } from '@/lib/api/form.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProductDto) => Promise<void>;
    product: Product | null;
    isLoading: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    product,
    isLoading
}) => {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateProductDto>({
        idParent2: 0, // Will be set by parent
        namaProduk: '',
        descProduk: '',
        kategoriHarga: 'Gratis',
        hargaModal: 0,
        hargaJual: 0,
        jenisProduk: 'Materi',
        authProduk: 'Umum',
        refCode: '',
        statusProduk: 'Draft',
        tanggalPublish: null,
    });

    // Form selector state
    const [isFormSelectorOpen, setIsFormSelectorOpen] = useState(false);
    const [attachedFormName, setAttachedFormName] = useState<string | null>(null);
    const [isAttachingForm, setIsAttachingForm] = useState(false);

    useEffect(() => {
        if (product) {
            // Format tanggalPublish for datetime-local input (YYYY-MM-DDTHH:mm)
            const formattedDate = product.tanggalPublish
                ? new Date(product.tanggalPublish).toISOString().slice(0, 16)
                : '';

            setFormData({
                idParent2: product.idParent2,
                namaProduk: product.namaProduk || '',
                descProduk: product.descProduk || '',
                kategoriHarga: product.kategoriHarga || 'Gratis',
                hargaModal: product.hargaModal || 0,
                hargaJual: product.hargaJual || 0,
                jenisProduk: product.jenisProduk || 'Materi',
                authProduk: product.authProduk || 'Umum',
                refCode: product.refCode || '',
                statusProduk: product.statusProduk || 'Draft',
                tanggalPublish: formattedDate || null,
            });

            // Fetch attached form name if exists
            if (product.customForm) {
                setAttachedFormName(product.customForm.namaForm);
            } else {
                setAttachedFormName(null);
            }
        } else {
            setFormData({
                idParent2: 0,
                namaProduk: '',
                descProduk: '',
                kategoriHarga: 'Gratis',
                hargaModal: 0,
                hargaJual: 0,
                jenisProduk: 'Materi',
                authProduk: 'Umum',
                refCode: '',
                statusProduk: 'Draft',
                tanggalPublish: null,
            });
        }
    }, [product, isOpen]);

    const handleFormTemplateSelect = async (idFormTemplate: number) => {
        if (!product?.idProduk) {
            showError('Simpan materi terlebih dahulu sebelum menambahkan form');
            setIsFormSelectorOpen(false);
            return;
        }

        try {
            setIsAttachingForm(true);
            const response = await formService.duplicateFormForProduct(
                product.idProduk,
                idFormTemplate,
                'product' // Can be 'product' for general purchase forms
            );
            setAttachedFormName(response.data.namaForm);
            showSuccess('Form berhasil diduplikasi dan dihubungkan!');
            setIsFormSelectorOpen(false);
        } catch (error: any) {
            showError(error.response?.data?.message || 'Gagal menduplikasi form');
        } finally {
            setIsAttachingForm(false);
        }
    };

    const handleEditForm = () => {
        if (product?.idForm) {
            router.push(`/admin/form-builder/edit/${product.idForm}`);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : 0 }));
        } else if (name === 'tanggalPublish') {
            // Auto-set status based on tanggalPublish
            const newStatus = value ? 'Publish' : 'Draft';
            setFormData(prev => ({
                ...prev,
                tanggalPublish: value || null,
                statusProduk: newStatus
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('📝 Form Submit Data:', formData);
            await onSubmit(formData);
        } catch (error) {
            console.error('❌ Form Submit Error:', error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Edit Materi' : 'Tambah Materi'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Materi */}
                <div>
                    <label htmlFor="namaProduk" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Materi <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaProduk"
                        name="namaProduk"
                        value={formData.namaProduk}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: Bab 1 - Pengenalan Matematika"
                    />
                </div>

                {/* Deskripsi */}
                <div>
                    <label htmlFor="descProduk" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi
                    </label>
                    <textarea
                        id="descProduk"
                        name="descProduk"
                        value={formData.descProduk}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Deskripsi materi pembelajaran"
                    />
                </div>

                {/* Row: Jenis & Auth */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="jenisProduk" className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis
                        </label>
                        <select
                            id="jenisProduk"
                            name="jenisProduk"
                            value={formData.jenisProduk}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Materi">Materi</option>
                            <option value="Produk">Produk</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="authProduk" className="block text-sm font-medium text-gray-700 mb-1">
                            Akses
                        </label>
                        <select
                            id="authProduk"
                            name="authProduk"
                            value={formData.authProduk}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Umum">Umum (Semua Siswa)</option>
                            <option value="Khusus">Khusus (Terdaftar)</option>
                        </select>
                    </div>
                </div>

                {/* Kategori Harga */}
                <div>
                    <label htmlFor="kategoriHarga" className="block text-sm font-medium text-gray-700 mb-1">
                        Kategori Harga
                    </label>
                    <select
                        id="kategoriHarga"
                        name="kategoriHarga"
                        value={formData.kategoriHarga}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="Gratis">Gratis</option>
                        <option value="Seikhlasnya">Seikhlasnya</option>
                        <option value="Bernominal">Bernominal</option>
                    </select>
                </div>

                {/* Conditional: Harga Fields (only for Bernominal) */}
                {formData.kategoriHarga === 'Bernominal' && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-blue-50 rounded-lg">
                        <div>
                            <label htmlFor="hargaModal" className="block text-sm font-medium text-gray-700 mb-1">
                                Harga Modal (Rp)
                            </label>
                            <input
                                type="number"
                                id="hargaModal"
                                name="hargaModal"
                                value={formData.hargaModal}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="hargaJual" className="block text-sm font-medium text-gray-700 mb-1">
                                Harga Jual (Rp) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                id="hargaJual"
                                name="hargaJual"
                                value={formData.hargaJual}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                required={formData.kategoriHarga === 'Bernominal'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Row: Ref Code & Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="refCode" className="block text-sm font-medium text-gray-700 mb-1">
                            Reference Code
                        </label>
                        <input
                            type="text"
                            id="refCode"
                            name="refCode"
                            value={formData.refCode}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Kode referensi (opsional)"
                        />
                    </div>
                    <div>
                        <label htmlFor="statusProduk" className="block text-sm font-medium text-gray-700 mb-1">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="statusProduk"
                            name="statusProduk"
                            value={formData.statusProduk}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Draft">Draft</option>
                            <option value="Publish">Publish</option>
                            <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                    </div>
                </div>

                {/* Tanggal Publish */}
                <div>
                    <label htmlFor="tanggalPublish" className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Publish (Opsional)
                    </label>
                    <input
                        type="datetime-local"
                        id="tanggalPublish"
                        name="tanggalPublish"
                        value={formData.tanggalPublish || ''}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Jika diisi, status akan otomatis menjadi "Publish". Kosongkan untuk "Draft".
                    </p>
                </div>

                {/* Info Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                        <strong>Tips:</strong> Gunakan status "Draft" untuk materi yang masih dalam pengembangan,
                        "Publish" untuk materi yang siap diakses siswa, dan "Non-Aktif" untuk materi yang diarsipkan.
                    </p>
                </div>

                {/* Form Pemesanan Section */}
                <div className="border-t pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Form Pemesanan
                    </label>
                    {attachedFormName ? (
                        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-900">
                                    ✓ Form terhubung: {attachedFormName}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleEditForm}
                                type="button"
                            >
                                Edit Form
                            </Button>
                        </div>
                    ) : (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <p className="text-sm text-gray-600 mb-2">
                                Belum ada form pemesanan. {product ? 'Pilih template untuk menduplikasi.' : 'Simpan materi dulu untuk menambahkan form.'}
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsFormSelectorOpen(true)}
                                type="button"
                                disabled={!product}
                            >
                                Pilih Template Form
                            </Button>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t">
                    <Button variant="ghost" onClick={onClose} type="button">
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        type="submit"
                        isLoading={isLoading}
                        disabled={isLoading}
                    >
                        {product ? 'Update' : 'Simpan'}
                    </Button>
                </div>
            </form>

            {/* Form Template Selector Modal */}
            <FormTemplateSelector
                isOpen={isFormSelectorOpen}
                onClose={() => setIsFormSelectorOpen(false)}
                onSelect={handleFormTemplateSelect}
                isLoading={isAttachingForm}
            />
        </Modal>
    );
};
