import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/media/ImageUploader';
import { Product, CreateProductDto } from '@/lib/api/product.service';
import { formService, Form } from '@/lib/api/form.service';
import { mediaService, Media } from '@/lib/api/media.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import { useRouter } from 'next/navigation';

interface ProductItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProductDto, selectedTemplateId?: number) => Promise<void>;
    product: Product | null;
    isLoading: boolean;
}

export const ProductItemFormModal: React.FC<ProductItemFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    product,
    isLoading
}) => {
    const router = useRouter();
    const [formData, setFormData] = useState<CreateProductDto>({
        idParent2: 0,
        namaProduk: '',
        descProduk: '',
        kategoriHarga: 'Gratis',
        hargaModal: 0,
        hargaJual: 0,
        jenisProduk: 'Produk', // Default to 'Produk' for Product management
        authProduk: 'Umum',
        refCode: '',
        statusProduk: 'Draft',
        tanggalPublish: null,
    });

    // Form templates state
    const [availableForms, setAvailableForms] = useState<Form[]>([]);
    const [loadingForms, setLoadingForms] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined);
    const [attachedFormName, setAttachedFormName] = useState<string | null>(null);
    const [isAttachingForm, setIsAttachingForm] = useState(false);

    // Media state
    const [uploadedMediaIds, setUploadedMediaIds] = useState<number[]>([]);
    const [existingMedia, setExistingMedia] = useState<Media[]>([]);
    const [loadingMedia, setLoadingMedia] = useState(false);

    const handleUploadComplete = useCallback((media: Array<{ idMedia: number, fileUrl: string, fileName: string }>) => {
        const mediaIds = media.map(m => m.idMedia);
        setUploadedMediaIds(mediaIds);
        (window as any).__uploadedMediaIds = mediaIds;
    }, []);

    // Load available form templates
    useEffect(() => {
        const loadForms = async () => {
            try {
                setLoadingForms(true);
                const response = await formService.getAll({ formType: 'template' });
                const forms = response.data.data || [];
                setAvailableForms(forms.filter((f: Form) => f.statusForm === 'Aktif'));
            } catch (error) {
                console.error('Failed to load forms:', error);
            } finally {
                setLoadingForms(false);
            }
        };

        if (isOpen) {
            loadForms();
        }
    }, [isOpen]);

    useEffect(() => {
        if (product) {
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
                jenisProduk: product.jenisProduk || 'Produk',
                authProduk: product.authProduk || 'Umum',
                refCode: product.refCode || '',
                statusProduk: product.statusProduk || 'Draft',
                tanggalPublish: formattedDate || null,
            });

            // Fetch attached form name if exists
            if (product.customForm) {
                setAttachedFormName(product.customForm.namaForm);
                setSelectedTemplateId(product.idForm || undefined);
            } else {
                setAttachedFormName(null);
                setSelectedTemplateId(undefined);
            }

            // Fetch existing media (all images, not just primary)
            const fetchExistingMedia = async () => {
                try {
                    setLoadingMedia(true);
                    const response = await mediaService.getMediaByEntity('product', product.idProduk);
                    const mediaList = (response.data as any)?.data || [];
                    setExistingMedia(Array.isArray(mediaList) ? mediaList : []);
                } catch (error) {
                    console.log('No existing media found');
                    setExistingMedia([]);
                } finally {
                    setLoadingMedia(false);
                }
            };

            fetchExistingMedia();
        } else {
            setFormData({
                idParent2: 0,
                namaProduk: '',
                descProduk: '',
                kategoriHarga: 'Gratis',
                hargaModal: 0,
                hargaJual: 0,
                jenisProduk: 'Produk', // Default to 'Produk'
                authProduk: 'Umum',
                refCode: '',
                statusProduk: 'Draft',
                tanggalPublish: null,
            });
            setAttachedFormName(null);
            setSelectedTemplateId(undefined);
            setExistingMedia([]);
        }
    }, [product, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value ? parseFloat(value) : 0 }));
        } else if (name === 'tanggalPublish') {
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
        await onSubmit(formData, selectedTemplateId);
    };

    // Auto-duplicate selected template after product is saved
    useEffect(() => {
        const autoDuplicateTemplate = async () => {
            if (product?.idProduk && selectedTemplateId && !attachedFormName) {
                try {
                    setIsAttachingForm(true);
                    const response = await formService.duplicateFormForProduct(
                        product.idProduk,
                        selectedTemplateId,
                        'product'
                    );
                    setAttachedFormName(response.data.namaForm);
                    showSuccess('Form berhasil dibuat dan dihubungkan!');
                } catch (error: any) {
                    showError(error.response?.data?.message || 'Gagal membuat form');
                } finally {
                    setIsAttachingForm(false);
                }
            }
        };

        autoDuplicateTemplate();
    }, [product?.idProduk, selectedTemplateId, attachedFormName]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={product ? 'Edit Product' : 'Tambah Product'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Product */}
                <div>
                    <label htmlFor="namaProduk" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Product <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaProduk"
                        name="namaProduk"
                        value={formData.namaProduk}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: Buku OSN Matematika, Seminar Orang Tua Hebat"
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
                        placeholder="Deskripsi produk"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gambar Produk
                    </label>

                    {/* Show existing thumbnail if editing */}
                    {product && existingMedia && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-2">Gambar Saat Ini:</p>
                            <div className="flex items-center gap-3">
                                <img
                                    src={existingMedia.fileUrl.startsWith('http')
                                        ? existingMedia.fileUrl
                                        : `http://localhost:5000/${existingMedia.fileUrl}`
                                    }
                                    alt="Current thumbnail"
                                    className="w-24 h-24 object-cover rounded-lg border border-gray-300"
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-700">{existingMedia.fileName}</p>
                                    <p className="text-xs text-gray-500 mt-1">Upload gambar baru untuk mengganti</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {loadingMedia && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-sm text-gray-500">Loading existing image...</p>
                        </div>
                    )}

                    <ImageUploader
                        entityType="product"
                        maxFiles={5}
                        onUploadComplete={handleUploadComplete}
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
                            <option value="Umum">Umum (Semua Orang)</option>
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

                {/* Conditional: Harga Fields */}
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

                {/* Form Pemesanan Section */}
                <div className="border-t pt-4">
                    <label htmlFor="formTemplate" className="block text-sm font-medium text-gray-700 mb-1">
                        Form Pemesanan
                    </label>
                    {attachedFormName ? (
                        <div className="flex items-center gap-2">
                            <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm font-medium text-green-900">
                                    ✓ Form terhubung: {attachedFormName}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => product?.idForm && router.push(`/admin/form-builder/edit/${product.idForm}`)}
                                type="button"
                                disabled={!product?.idForm}
                            >
                                Edit Form
                            </Button>
                        </div>
                    ) : (
                        <select
                            id="formTemplate"
                            value={selectedTemplateId || ''}
                            onChange={(e) => setSelectedTemplateId(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={loadingForms}
                        >
                            <option value="">Pilih template form...</option>
                            {availableForms.map((form) => (
                                <option key={form.idForm} value={form.idForm}>
                                    {form.namaForm} ({form.fields?.length || 0} fields)
                                </option>
                            ))}
                        </select>
                    )}
                    {selectedTemplateId && !product && (
                        <p className="text-xs text-blue-600 mt-1">
                            Form akan dibuat otomatis setelah produk disimpan.
                        </p>
                    )}
                </div>

                {/* Info Box */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                        <strong>Tips:</strong> Gunakan status "Draft" untuk produk yang masih dalam pengembangan,
                        "Publish" untuk produk yang siap dijual, dan "Non-Aktif" untuk produk yang diarsipkan.
                    </p>
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
        </Modal>
    );
};
