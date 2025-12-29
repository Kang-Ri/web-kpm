import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Product, CreateProductDto } from '@/lib/api/product.service';

interface ProductItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateProductDto) => Promise<void>;
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
        await onSubmit(formData);
    };

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
