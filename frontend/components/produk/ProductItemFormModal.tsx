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


    // Auto-calculate hargaAkhir when discount fields change
    useEffect(() => {
        const calculateFinalPrice = () => {
            const { hargaJual, diskonAktif, tipeDiskon, nilaiDiskon, diskonMulai, diskonBerakhir } = formData;

            // If no discount active, final price = selling price
            if (!diskonAktif || !nilaiDiskon || nilaiDiskon <= 0) {
                setHargaAkhir(hargaJual);
                return;
            }

            // Check if discount period is valid
            const now = new Date();
            const startValid = !diskonMulai || now >= new Date(diskonMulai);
            const endValid = !diskonBerakhir || now <= new Date(diskonBerakhir);

            if (!startValid || !endValid) {
                setHargaAkhir(hargaJual);
                return;
            }

            // Calculate discount
            let finalPrice = hargaJual;
            if (tipeDiskon === 'percentage') {
                finalPrice = hargaJual - (hargaJual * nilaiDiskon / 100);
            } else if (tipeDiskon === 'nominal') {
                finalPrice = Math.max(0, hargaJual - nilaiDiskon);
            }

            setHargaAkhir(finalPrice);
        };

        calculateFinalPrice();
    }, [formData.hargaJual, formData.diskonAktif, formData.tipeDiskon, formData.nilaiDiskon, formData.diskonMulai, formData.diskonBerakhir]);

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
                    </label>                    {/* Show existing thumbnails if editing */}
                    {product && existingMedia.length > 0 && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-600 mb-2">Gambar Saat Ini ({existingMedia.length}):</p>
                            <div className="grid grid-cols-2 gap-2">
                                {existingMedia.map((media, index) => (
                                    <div key={media.idMedia} className="flex items-center gap-2 p-2 bg-white rounded border">
                                        <img
                                            src={media.fileUrl.startsWith('http')
                                                ? media.fileUrl
                                                : `http://localhost:5000/${media.fileUrl}`
                                            }
                                            alt={`Image ${index + 1}`}
                                            className="w-16 h-16 object-cover rounded border border-gray-300"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium text-gray-700 truncate">{media.fileName}</p>
                                            <p className="text-xs text-gray-500">#{index + 1}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Upload gambar baru untuk mengganti semua</p>
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


                {/* === COLLAPSIBLE SECTION 1: PRICING & DISCOUNT === */}
                <details className="border border-gray-300 rounded-lg p-4 bg-gray-50" open>
                    <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                        💰 Harga Saran & Diskon
                        <span className="text-xs text-gray-500 font-normal">(Opsional)</span>
                    </summary>

                    <div className="mt-4 space-y-4">
                        {/* Harga Saran */}
                        <div>
                            <label htmlFor="hargaSaran" className="block text-sm font-medium text-gray-700 mb-1">
                                Harga Saran (MSRP)
                            </label>
                            <input
                                type="number"
                                id="hargaSaran"
                                name="hargaSaran"
                                value={formData.hargaSaran}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Harga rekomendasi pasar"
                            />
                            <p className="text-xs text-gray-500 mt-1">Harga yang disarankan untuk konsumen</p>
                        </div>

                        {/* Discount Toggle */}
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                            <input
                                type="checkbox"
                                id="diskonAktif"
                                name="diskonAktif"
                                checked={formData.diskonAktif}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="diskonAktif" className="text-sm font-medium text-gray-900 cursor-pointer">
                                Aktifkan Diskon
                            </label>
                        </div>

                        {/* Discount Fields (conditional) */}
                        {formData.diskonAktif && (
                            <div className="pl-6 border-l-4 border-green-500 space-y-4">
                                {/* Discount Type & Value */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="tipeDiskon" className="block text-sm font-medium text-gray-700 mb-1">
                                            Tipe Diskon
                                        </label>
                                        <select
                                            id="tipeDiskon"
                                            name="tipeDiskon"
                                            value={formData.tipeDiskon}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        >
                                            <option value="percentage">Persentase (%)</option>
                                            <option value="nominal">Nominal (Rp)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="nilaiDiskon" className="block text-sm font-medium text-gray-700 mb-1">
                                            Nilai Diskon
                                        </label>
                                        <input
                                            type="number"
                                            id="nilaiDiskon"
                                            name="nilaiDiskon"
                                            value={formData.nilaiDiskon}
                                            onChange={handleChange}
                                            min="0"
                                            step={formData.tipeDiskon === 'percentage' ? '1' : '0.01'}
                                            max={formData.tipeDiskon === 'percentage' ? '100' : undefined}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder={formData.tipeDiskon === 'percentage' ? 'Contoh: 20' : 'Contoh: 10000'}
                                        />
                                    </div>
                                </div>

                                {/* Discount Period */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="diskonMulai" className="block text-sm font-medium text-gray-700 mb-1">
                                            Berlaku Dari
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="diskonMulai"
                                            name="diskonMulai"
                                            value={formData.diskonMulai || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="diskonBerakhir" className="block text-sm font-medium text-gray-700 mb-1">
                                            Sampai
                                        </label>
                                        <input
                                            type="datetime-local"
                                            id="diskonBerakhir"
                                            name="diskonBerakhir"
                                            value={formData.diskonBerakhir || ''}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Final Price Preview */}
                                {hargaAkhir !== formData.hargaJual && (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm text-gray-600">Harga Akhir:</p>
                                                <p className="text-2xl font-bold text-green-700">
                                                    Rp {hargaAkhir.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-600">Hemat:</p>
                                                <p className="text-lg font-semibold text-green-600">
                                                    Rp {(formData.hargaJual - hargaAkhir).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    ({((formData.hargaJual - hargaAkhir) / formData.hargaJual * 100).toFixed(1)}%)
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </details>

                {/* === COLLAPSIBLE SECTION 2: INVENTORY === */}
                <details className="border border-gray-300 rounded-lg p-4 bg-gray-50" open>
                    <summary className="cursor-pointer font-semibold text-gray-900 flex items-center gap-2">
                        📦 Stok & Inventory
                        <span className="text-xs text-gray-500 font-normal">(Manajemen stok)</span>
                    </summary>

                    <div className="mt-4 space-y-4">
                        {/* Digital Product Toggle */}
                        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                            <input
                                type="checkbox"
                                id="produkDigital"
                                name="produkDigital"
                                checked={formData.produkDigital}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <label htmlFor="produkDigital" className="text-sm font-medium text-gray-900 cursor-pointer">
                                Produk Digital (E-book, Video, dll)
                            </label>
                        </div>

                        {/* Inventory Fields (conditional - hidden for digital products) */}
                        {!formData.produkDigital && (
                            <div className="pl-6 border-l-4 border-blue-500 space-y-4">
                                {/* Track Inventory Toggle */}
                                <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
                                    <input
                                        type="checkbox"
                                        id="trackInventory"
                                        name="trackInventory"
                                        checked={formData.trackInventory}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                    />
                                    <label htmlFor="trackInventory" className="text-sm font-medium text-gray-900 cursor-pointer">
                                        Lacak Stok (Track Inventory)
                                    </label>
                                </div>

                                {/* Stock Fields (conditional) */}
                                {formData.trackInventory && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="stokProduk" className="block text-sm font-medium text-gray-700 mb-1">
                                                Jumlah Stok <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                id="stokProduk"
                                                name="stokProduk"
                                                value={formData.stokProduk}
                                                onChange={handleChange}
                                                min="0"
                                                step="1"
                                                required={formData.trackInventory && !formData.produkDigital}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Contoh: 100"
                                            />
                                            {formData.stokProduk <= formData.minStokAlert && formData.stokProduk > 0 && (
                                                <p className="text-xs text-yellow-600 mt-1">⚠️ Stok rendah!</p>
                                            )}
                                            {formData.stokProduk === 0 && (
                                                <p className="text-xs text-red-600 mt-1">❌ Stok habis!</p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="minStokAlert" className="block text-sm font-medium text-gray-700 mb-1">
                                                Alert Stok Minimum
                                            </label>
                                            <input
                                                type="number"
                                                id="minStokAlert"
                                                name="minStokAlert"
                                                value={formData.minStokAlert}
                                                onChange={handleChange}
                                                min="0"
                                                step="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Contoh: 10"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Notifikasi saat stok {'<'} nilai ini</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Info for digital products */}
                        {formData.produkDigital && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm text-blue-800">
                                    ℹ️ Produk digital tidak memerlukan manajemen stok (unlimited)
                                </p>
                            </div>
                        )}
                    </div>
                </details>

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
