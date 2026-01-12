'use client';

import { FC, useState } from 'react';
import { X } from 'lucide-react';

interface ProfileCompletionModalProps {
    isOpen: boolean;
    siswaName: string;
    onComplete: (data: CompleteProfileData) => void;
    onClose?: () => void;
    isLoading?: boolean;
}

export interface CompleteProfileData {
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: 'Laki-laki' | 'Perempuan';
    jenjangKelas: string; // Required!
    asalSekolah?: string;
    noHp?: string;
    agama?: string;
}

export const ProfileCompletionModal: FC<ProfileCompletionModalProps> = ({
    isOpen,
    siswaName,
    onComplete,
    onClose,
    isLoading = false
}) => {
    const [formData, setFormData] = useState<CompleteProfileData>({
        tempatLahir: '',
        tanggalLahir: '',
        jenisKelamin: undefined,
        jenjangKelas: '',
        asalSekolah: '',
        noHp: '',
        agama: ''
    });

    const [errors, setErrors] = useState<{ jenjangKelas?: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user types
        if (name === 'jenjangKelas' && value) {
            setErrors(prev => ({ ...prev, jenjangKelas: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate required field
        if (!formData.jenjangKelas) {
            setErrors({ jenjangKelas: 'Jenjang Kelas wajib diisi' });
            return;
        }

        onComplete(formData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Lengkapi Profil Anda</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Halo <span className="font-semibold">{siswaName}</span>! Mohon lengkapi profil untuk melanjutkan.
                        </p>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            disabled={isLoading}
                        >
                            <X className="w-6 h-6" />
                        </button>
                    )}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Required Notice */}
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                        <p className="text-sm text-blue-800">
                            <span className="font-semibold">⭐ Jenjang Kelas</span> wajib diisi untuk melihat daftar kelas yang tersedia.
                        </p>
                    </div>

                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Jenjang Kelas - REQUIRED */}
                        <div className="md:col-span-2">
                            <label htmlFor="jenjangKelas" className="block text-sm font-medium text-gray-700 mb-1">
                                Jenjang Kelas <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="jenjangKelas"
                                name="jenjangKelas"
                                value={formData.jenjangKelas}
                                onChange={handleChange}
                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.jenjangKelas ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                disabled={isLoading}
                            >
                                <option value="">-- Pilih Jenjang Kelas --</option>
                                {[...Array(12)].map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        Kelas {i + 1}
                                    </option>
                                ))}
                            </select>
                            {errors.jenjangKelas && (
                                <p className="text-sm text-red-600 mt-1">{errors.jenjangKelas}</p>
                            )}
                        </div>

                        {/* Tempat Lahir */}
                        <div>
                            <label htmlFor="tempatLahir" className="block text-sm font-medium text-gray-700 mb-1">
                                Tempat Lahir
                            </label>
                            <input
                                type="text"
                                id="tempatLahir"
                                name="tempatLahir"
                                value={formData.tempatLahir}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Contoh: Jakarta"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Tanggal Lahir */}
                        <div>
                            <label htmlFor="tanggalLahir" className="block text-sm font-medium text-gray-700 mb-1">
                                Tanggal Lahir
                            </label>
                            <input
                                type="date"
                                id="tanggalLahir"
                                name="tanggalLahir"
                                value={formData.tanggalLahir}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Jenis Kelamin */}
                        <div>
                            <label htmlFor="jenisKelamin" className="block text-sm font-medium text-gray-700 mb-1">
                                Jenis Kelamin
                            </label>
                            <select
                                id="jenisKelamin"
                                name="jenisKelamin"
                                value={formData.jenisKelamin || ''}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            >
                                <option value="">-- Pilih --</option>
                                <option value="Laki-laki">Laki-laki</option>
                                <option value="Perempuan">Perempuan</option>
                            </select>
                        </div>

                        {/* Agama */}
                        <div>
                            <label htmlFor="agama" className="block text-sm font-medium text-gray-700 mb-1">
                                Agama
                            </label>
                            <select
                                id="agama"
                                name="agama"
                                value={formData.agama}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                disabled={isLoading}
                            >
                                <option value="">-- Pilih --</option>
                                <option value="Islam">Islam</option>
                                <option value="Kristen">Kristen</option>
                                <option value="Katolik">Katolik</option>
                                <option value="Hindu">Hindu</option>
                                <option value="Buddha">Buddha</option>
                                <option value="Konghucu">Konghucu</option>
                            </select>
                        </div>

                        {/* Asal Sekolah */}
                        <div className="md:col-span-2">
                            <label htmlFor="asalSekolah" className="block text-sm font-medium text-gray-700 mb-1">
                                Asal Sekolah
                            </label>
                            <input
                                type="text"
                                id="asalSekolah"
                                name="asalSekolah"
                                value={formData.asalSekolah}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Contoh: SMAN 1 Jakarta"
                                disabled={isLoading}
                            />
                        </div>

                        {/* No HP */}
                        <div className="md:col-span-2">
                            <label htmlFor="noHp" className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor HP / WhatsApp
                            </label>
                            <input
                                type="tel"
                                id="noHp"
                                name="noHp"
                                value={formData.noHp}
                                onChange={handleChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Contoh: 08123456789"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        {onClose && (
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                disabled={isLoading}
                            >
                                Batal
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>🎓 Simpan & Lanjutkan</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
