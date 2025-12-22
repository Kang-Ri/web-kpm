import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ParentProduct2, CreateParentProduct2Dto } from '@/lib/api/parentProduct2.service';

interface ParentProduct2FormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateParentProduct2Dto) => Promise<void>;
    ruangKelas: ParentProduct2 | null;
    isLoading: boolean;
}

const JENJANG_KELAS_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const ParentProduct2FormModal: React.FC<ParentProduct2FormModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    ruangKelas,
    isLoading
}) => {
    const [formData, setFormData] = useState<CreateParentProduct2Dto>({
        idParent1: 0, // Will be set by parent
        namaParent2: '',
        descParent2: '',
        tglPublish: '',
        status: 'Non-Aktif',
        tahunAjaran: '',
        kapasitasMaksimal: undefined,
        jenjangKelasIzin: [],
        daftarUlangAktif: false,
        kategoriHargaDaftarUlang: 'Gratis',
        hargaDaftarUlang: 0,
    });

    useEffect(() => {
        if (ruangKelas) {
            setFormData({
                idParent1: ruangKelas.idParent1,
                namaParent2: ruangKelas.namaParent2 || '',
                descParent2: ruangKelas.descParent2 || '',
                tglPublish: ruangKelas.tglPublish ? ruangKelas.tglPublish.split('T')[0] : '',
                status: ruangKelas.status || 'Non-Aktif',
                tahunAjaran: ruangKelas.tahunAjaran || '',
                kapasitasMaksimal: ruangKelas.kapasitasMaksimal,
                jenjangKelasIzin: ruangKelas.jenjangKelasIzin || [],
                daftarUlangAktif: ruangKelas.daftarUlangAktif || false,
                kategoriHargaDaftarUlang: ruangKelas.kategoriHargaDaftarUlang || 'Gratis',
                hargaDaftarUlang: ruangKelas.hargaDaftarUlang || 0,
            });
        } else {
            setFormData({
                idParent1: 0,
                namaParent2: '',
                descParent2: '',
                tglPublish: '',
                status: 'Non-Aktif',
                tahunAjaran: '',
                kapasitasMaksimal: undefined,
                jenjangKelasIzin: [],
                daftarUlangAktif: false,
                kategoriHargaDaftarUlang: 'Gratis',
                hargaDaftarUlang: 0,
            });
        }
    }, [ruangKelas, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (type === 'number') {
            setFormData(prev => ({ ...prev, [name]: value ? parseInt(value) : undefined }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleJenjangKelasToggle = (jenjang: string) => {
        setFormData(prev => {
            const currentJenjang = prev.jenjangKelasIzin || [];
            const isSelected = currentJenjang.includes(jenjang);

            return {
                ...prev,
                jenjangKelasIzin: isSelected
                    ? currentJenjang.filter(j => j !== jenjang)
                    : [...currentJenjang, jenjang]
            };
        });
    };

    const handleSelectAllJenjang = () => {
        const allSelected = formData.jenjangKelasIzin?.length === JENJANG_KELAS_OPTIONS.length;
        setFormData(prev => ({
            ...prev,
            jenjangKelasIzin: allSelected ? [] : [...JENJANG_KELAS_OPTIONS]
        }));
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
            title={ruangKelas ? 'Edit Ruang Kelas' : 'Tambah Ruang Kelas'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Ruang Kelas */}
                <div>
                    <label htmlFor="namaParent2" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Ruang Kelas <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="namaParent2"
                        name="namaParent2"
                        value={formData.namaParent2}
                        onChange={handleChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contoh: Ruang Matematika A"
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
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Masukkan deskripsi ruang kelas"
                    />
                </div>

                {/* Row: Tahun Ajaran & Kapasitas */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tahunAjaran" className="block text-sm font-medium text-gray-700 mb-1">
                            Tahun Ajaran
                        </label>
                        <input
                            type="text"
                            id="tahunAjaran"
                            name="tahunAjaran"
                            value={formData.tahunAjaran}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="2024/2025"
                        />
                    </div>
                    <div>
                        <label htmlFor="kapasitasMaksimal" className="block text-sm font-medium text-gray-700 mb-1">
                            Kapasitas Maksimal
                        </label>
                        <input
                            type="number"
                            id="kapasitasMaksimal"
                            name="kapasitasMaksimal"
                            value={formData.kapasitasMaksimal || ''}
                            onChange={handleChange}
                            min="0"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Kosongkan untuk unlimited"
                        />
                    </div>
                </div>

                {/* Jenjang Kelas Izin */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                            Jenjang Kelas yang Diperbolehkan
                        </label>
                        <button
                            type="button"
                            onClick={handleSelectAllJenjang}
                            className="text-xs text-blue-600 hover:text-blue-800"
                        >
                            {formData.jenjangKelasIzin?.length === JENJANG_KELAS_OPTIONS.length ? 'Deselect All' : 'Select All'}
                        </button>
                    </div>
                    <div className="grid grid-cols-6 gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                        {JENJANG_KELAS_OPTIONS.map(jenjang => (
                            <label key={jenjang} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                                <input
                                    type="checkbox"
                                    checked={formData.jenjangKelasIzin?.includes(jenjang) || false}
                                    onChange={() => handleJenjangKelasToggle(jenjang)}
                                    className="rounded"
                                />
                                <span className="text-sm">Kelas {jenjang}</span>
                            </label>
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Kosongkan untuk mengizinkan semua jenjang kelas</p>
                </div>

                {/* Daftar Ulang Settings */}
                <div className="border-t pt-4">
                    <div className="flex items-center mb-3">
                        <input
                            type="checkbox"
                            id="daftarUlangAktif"
                            name="daftarUlangAktif"
                            checked={formData.daftarUlangAktif}
                            onChange={handleChange}
                            className="rounded"
                        />
                        <label htmlFor="daftarUlangAktif" className="ml-2 text-sm font-medium text-gray-700">
                            Aktifkan Daftar Ulang
                        </label>
                    </div>

                    {formData.daftarUlangAktif && (
                        <div className="ml-6 space-y-3 bg-blue-50 p-3 rounded-lg">
                            <div>
                                <label htmlFor="kategoriHargaDaftarUlang" className="block text-sm font-medium text-gray-700 mb-1">
                                    Kategori Harga Daftar Ulang
                                </label>
                                <select
                                    id="kategoriHargaDaftarUlang"
                                    name="kategoriHargaDaftarUlang"
                                    value={formData.kategoriHargaDaftarUlang}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Gratis">Gratis</option>
                                    <option value="Seikhlasnya">Seikhlasnya</option>
                                    <option value="Bernominal">Bernominal</option>
                                </select>
                            </div>

                            {formData.kategoriHargaDaftarUlang === 'Bernominal' && (
                                <div>
                                    <label htmlFor="hargaDaftarUlang" className="block text-sm font-medium text-gray-700 mb-1">
                                        Harga Daftar Ulang (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        id="hargaDaftarUlang"
                                        name="hargaDaftarUlang"
                                        value={formData.hargaDaftarUlang}
                                        onChange={handleChange}
                                        min="0"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Row: Tanggal Publish & Status */}
                <div className="grid grid-cols-2 gap-4">
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
                        {ruangKelas ? 'Update' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
