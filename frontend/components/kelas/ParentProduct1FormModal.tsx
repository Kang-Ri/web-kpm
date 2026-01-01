import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ParentProduct1, CreateParentProduct1Dto } from '@/lib/api/parentProduct1.service';
import { ImageUploader, UploadedMedia } from '@/components/media/ImageUploader';
import { mediaService } from '@/lib/api/media.service';

interface ParentProduct1FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateParentProduct1Dto) => Promise<void>;
    kategori: ParentProduct1 | null;
    isLoading: boolean;
}

export const ParentProduct1FormModal: React.FC<ParentProduct1FormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    kategori,
    isLoading
}) => {
    const [formData, setFormData] = useState<CreateParentProduct1Dto>({
        namaParent1: '',
        descParent1: '',
        tglPublish: '',
        status: 'Non-Aktif',
    });

    // Image upload state (optional)
    const [uploadedMediaIds, setUploadedMediaIds] = useState<number[]>([]);

    useEffect(() => {
        if (kategori) {
            setFormData({
                namaParent1: kategori.namaParent1 || '',
                descParent1: kategori.descParent1 || '',
                tglPublish: kategori.tglPublish ? kategori.tglPublish.split('T')[0] : '',
                status: kategori.status || 'Non-Aktif',
            });
        } else {
            setFormData({
                namaParent1: '',
                descParent1: '',
                tglPublish: '',
                status: 'Non-Aktif',
            });
        }
    }, [kategori, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUploadComplete = (media: UploadedMedia[]) => {
        const ids = media.map(m => m.idMedia);
        setUploadedMediaIds(ids);
        console.log('🖼️ Uploaded media IDs:', ids);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            console.log('📝 Form Submit Data:', formData);
            const response: any = await onSubmit(formData);

            // Link uploaded media to kategori (optional)
            if (uploadedMediaIds.length > 0 && response?.data?.idParent1) {
                console.log('🔗 Linking media to kategori:', response.data.idParent1);
                for (const idMedia of uploadedMediaIds) {
                    await mediaService.linkToEntity(idMedia, response.data.idParent1);
                }
                console.log('✅ Media linked successfully');
            }
        } catch (error) {
            console.error('❌ Form Submit Error:', error);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={kategori ? 'Edit Kategori Kelas' : 'Tambah Kategori Kelas'}
            size="md"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Kategori */}
                <div>
                    <label htmlFor="namaParent1" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Kategori <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaParent1"
                        name="namaParent1"
                        value={formData.namaParent1}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan nama kategori"
                    />
                </div>

                {/* Deskripsi */}
                <div>
                    <label htmlFor="descParent1" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi
                    </label>
                    <textarea
                        id="descParent1"
                        name="descParent1"
                        value={formData.descParent1}
                        onChange={handleChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan deskripsi kategori"
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

                {/* Image Upload (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gambar Thumbnail <span className="text-gray-400 text-xs">(Opsional)</span>
                    </label>
                    <ImageUploader
                        entityType="parent1"
                        category="thumbnail"
                        maxFiles={1}
                        onUploadComplete={handleUploadComplete}
                    />
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
                        {kategori ? 'Update' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
