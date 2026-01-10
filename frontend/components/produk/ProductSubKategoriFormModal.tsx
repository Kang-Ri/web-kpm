import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/media/ImageUploader';
import { ParentProduct2, CreateParentProduct2Dto } from '@/lib/api/parentProduct2.service';
import { mediaService, Media } from '@/lib/api/media.service';

interface ProductSubKategoriFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateParentProduct2Dto) => Promise<void>;
    subKategori: ParentProduct2 | null;
    isLoading: boolean;
}

export const ProductSubKategoriFormModal: React.FC<ProductSubKategoriFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    subKategori,
    isLoading
}) => {
    const [formData, setFormData] = useState<CreateParentProduct2Dto>({
        idParent1: 0, // Will be set by parent
        namaParent2: '',
        descParent2: '',
        tglPublish: '',
        status: 'Non-Aktif',
    });

    const [uploadedMediaIds, setUploadedMediaIds] = useState<number[]>([]);
    const [existingMedia, setExistingMedia] = useState<Media | null>(null);
    const [loadingMedia, setLoadingMedia] = useState(false);

    const handleUploadComplete = useCallback((media: Array<{ idMedia: number, fileUrl: string, fileName: string }>) => {
        const mediaIds = media.map(m => m.idMedia);
        setUploadedMediaIds(mediaIds);
        (window as any).__uploadedMediaIds = mediaIds;
    }, []);

    useEffect(() => {
        if (subKategori) {
            setFormData({
                idParent1: subKategori.idParent1,
                namaParent2: subKategori.namaParent2 || '',
                descParent2: subKategori.descParent2 || '',
                tglPublish: subKategori.tglPublish ? subKategori.tglPublish.split('T')[0] : '',
                status: subKategori.status || 'Non-Aktif',
            });

            // Fetch existing media
            const fetchExistingMedia = async () => {
                try {
                    setLoadingMedia(true);
                    const response = await mediaService.getPrimaryMedia('parent2', subKategori.idParent2);
                    const media = (response.data as any)?.data || null;
                    setExistingMedia(media);
                } catch (error) {
                    console.log('No existing media found');
                    setExistingMedia(null);
                } finally {
                    setLoadingMedia(false);
                }
            };

            fetchExistingMedia();
        } else {
            setFormData({
                idParent1: 0,
                namaParent2: '',
                descParent2: '',
                tglPublish: '',
                status: 'Non-Aktif',
            });
            setExistingMedia(null);
        }
    }, [subKategori, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSubmit(formData);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={subKategori ? 'Edit Sub-Kategori' : 'Tambah Sub-Kategori'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Sub-Kategori */}
                <div>
                    <label htmlFor="namaParent2" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Sub-Kategori <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaParent2"
                        name="namaParent2"
                        value={formData.namaParent2}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: Buku Olimpiade, Seminar, dll"
                    />
                </div>

                {/* Deskripsi */}
                <div>
                    <label htmlFor="descParent2" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi
                    </label>
                    <textarea
                        id="descParent2"
                        name="descParent2"
                        value={formData.descParent2}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan deskripsi sub-kategori produk"
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gambar Sub-Kategori
                    </label>

                    {/* Show existing thumbnail if editing */}
                    {subKategori && existingMedia && (
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
                        entityType="parent2"
                        maxFiles={1}
                        onUploadComplete={handleUploadComplete}
                    />
                </div>

                {/* Tanggal Publish */}
                <div>
                    <label htmlFor="tglPublish" className="block text-sm font-medium text-gray-700 mb-1">
                        Tanggal Publish
                    </label>
                    <input
                        type="date"
                        id="tglPublish"
                        name="tglPublish"
                        value={formData.tglPublish}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Status */}
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                        Status <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="Aktif">Aktif</option>
                        <option value="Non-Aktif">Non-Aktif</option>
                    </select>
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
                        {subKategori ? 'Update' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
