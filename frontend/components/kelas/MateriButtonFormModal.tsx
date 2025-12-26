import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MateriButton, CreateMateriButtonDto } from '@/lib/api/materiButton.service';

interface MateriButtonFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateMateriButtonDto) => Promise<void>;
    button: MateriButton | null;
    isLoading: boolean;
}

export const MateriButtonFormModal: React.FC<MateriButtonFormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    button,
    isLoading
}) => {
    const [formData, setFormData] = useState<CreateMateriButtonDto>({
        idProduk: 0,
        judulButton: '',
        namaButton: '',
        linkTujuan: '',
        deskripsiButton: '',
        tanggalPublish: '',
        tanggalExpire: '',
        statusButton: 'Active',
        orderIndex: 0,
    });

    useEffect(() => {
        if (button) {
            setFormData({
                idProduk: button.idProduk,
                judulButton: button.judulButton || '',
                namaButton: button.namaButton || '',
                linkTujuan: button.linkTujuan || '',
                deskripsiButton: button.deskripsiButton || '',
                tanggalPublish: button.tanggalPublish ? button.tanggalPublish.substring(0, 16) : '',
                tanggalExpire: button.tanggalExpire ? button.tanggalExpire.substring(0, 16) : '',
                statusButton: button.statusButton || 'Active',
                orderIndex: button.orderIndex || 0,
            });
        } else {
            setFormData({
                idProduk: 0,
                judulButton: '',
                namaButton: '',
                linkTujuan: '',
                deskripsiButton: '',
                tanggalPublish: '',
                tanggalExpire: '',
                statusButton: 'Active',
                orderIndex: 0,
            });
        }
    }, [button, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : 0 }));
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
            title={button ? 'Edit Button' : 'Tambah Button'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Judul Button */}
                <div>
                    <label htmlFor="judulButton" className="block text-sm font-medium text-gray-700 mb-1">
                        Judul
                    </label>
                    <input
                        type="text"
                        id="judulButton"
                        name="judulButton"
                        value={formData.judulButton}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: Materi Pelajaran, Link Tugas, dll"
                    />
                    <p className="text-xs text-gray-500 mt-1">Opsional - Judul/heading untuk mengelompokkan button</p>
                </div>

                {/* Nama Button */}
                <div>
                    <label htmlFor="namaButton" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Button <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaButton"
                        name="namaButton"
                        value={formData.namaButton}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: Download PDF, Tonton Video, Kerjakan Quiz"
                    />
                </div>

                {/* Link Tujuan */}
                <div>
                    <label htmlFor="linkTujuan" className="block text-sm font-medium text-gray-700 mb-1">
                        Link Tujuan <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="url"
                        id="linkTujuan"
                        name="linkTujuan"
                        value={formData.linkTujuan}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://example.com/file.pdf"
                    />
                </div>

                {/* Deskripsi */}
                <div>
                    <label htmlFor="deskripsiButton" className="block text-sm font-medium text-gray-700 mb-1">
                        Deskripsi
                    </label>
                    <textarea
                        id="deskripsiButton"
                        name="deskripsiButton"
                        value={formData.deskripsiButton}
                        onChange={handleChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Deskripsi singkat button (opsional)"
                    />
                </div>

                {/* Scheduling Section */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                    <h4 className="font-medium text-gray-900">Penjadwalan (Opsional)</h4>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label htmlFor="tanggalPublish" className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Publish
                            </label>
                            <input
                                type="datetime-local"
                                id="tanggalPublish"
                                name="tanggalPublish"
                                value={formData.tanggalPublish}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label htmlFor="tanggalExpire" className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Expire
                            </label>
                            <input
                                type="datetime-local"
                                id="tanggalExpire"
                                name="tanggalExpire"
                                value={formData.tanggalExpire}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <p className="text-xs text-gray-600">
                        Kosongkan jika ingin button langsung aktif. Tanggal publish untuk jadwal otomatis, expire untuk batas waktu.
                    </p>
                </div>

                {/* Row: Order & Status */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-1">
                            Urutan
                        </label>
                        <input
                            type="number"
                            id="orderIndex"
                            name="orderIndex"
                            value={formData.orderIndex}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">0 = paling atas</p>
                    </div>
                    <div>
                        <label htmlFor="statusButton" className="block text-sm font-medium text-gray-700 mb-1">
                            Status <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="statusButton"
                            name="statusButton"
                            value={formData.statusButton}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
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
                        {button ? 'Update' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
