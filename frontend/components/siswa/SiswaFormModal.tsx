'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Siswa, CreateSiswaDto } from '@/lib/api/siswa.service';

const siswaSchema = z.object({
    namaLengkap: z.string().min(1, 'Nama lengkap wajib diisi'),
    email: z.string().email('Email tidak valid').optional().or(z.literal('')),
    noHp: z.string().max(20, 'No HP maksimal 20 karakter').optional(),
    nik: z.string().max(16, 'NIK maksimal 16 karakter').optional(),
    nisn: z.string().max(10, 'NISN maksimal 10 karakter').optional(),
    jenjangKelas: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']).optional(),
    asalSekolah: z.string().max(255, 'Asal sekolah maksimal 255 karakter').optional(),
    tempatLahir: z.string().max(100, 'Tempat lahir maksimal 100 karakter').optional(),
    tanggalLahir: z.string().optional(),
    jenisKelamin: z.enum(['Laki-laki', 'Perempuan']).optional(),
    statusAktif: z.enum(['Aktif', 'Non-Aktif']),
});

type SiswaFormData = z.infer<typeof siswaSchema>;

interface SiswaFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateSiswaDto) => Promise<void>;
    siswa?: Siswa | null;
    isLoading?: boolean;
}

export function SiswaFormModal({
    isOpen,
    onClose,
    onSubmit,
    siswa,
    isLoading = false,
}: SiswaFormModalProps) {
    const isEdit = !!siswa;

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<SiswaFormData>({
        resolver: zodResolver(siswaSchema),
        defaultValues: {
            statusAktif: 'Aktif',
        },
    });

    useEffect(() => {
        if (isOpen) {
            if (siswa) {
                // Edit mode - populate with siswa data
                reset({
                    namaLengkap: siswa.namaLengkap,
                    email: siswa.email || '',
                    noHp: siswa.noHp || '',
                    nik: siswa.nik || '',
                    nisn: siswa.nisn || '',
                    jenjangKelas: siswa.jenjangKelas || undefined,
                    asalSekolah: siswa.asalSekolah || '',
                    tempatLahir: siswa.tempatLahir || '',
                    tanggalLahir: siswa.tanggalLahir || '',
                    jenisKelamin: siswa.jenisKelamin || undefined,
                    statusAktif: siswa.statusAktif || 'Aktif',
                });
            } else {
                // Create mode - reset to empty
                reset({
                    namaLengkap: '',
                    email: '',
                    noHp: '',
                    nik: '',
                    nisn: '',
                    jenjangKelas: undefined,
                    asalSekolah: '',
                    tempatLahir: '',
                    tanggalLahir: '',
                    jenisKelamin: undefined,
                    statusAktif: 'Aktif',
                });
            }
        }
    }, [isOpen, siswa, reset]);

    const handleFormSubmit = async (data: SiswaFormData) => {
        await onSubmit(data as CreateSiswaDto);
        reset();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
            size="lg"
        >
            <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                {/* Nama Lengkap */}
                <div>
                    <label htmlFor="namaLengkap" className="block text-sm font-medium text-gray-700 mb-1">
                        Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                        {...register('namaLengkap')}
                        id="namaLengkap"
                        type="text"
                        className="input"
                        placeholder="Masukkan nama lengkap"
                    />
                    {errors.namaLengkap && (
                        <p className="mt-1 text-sm text-red-600">{errors.namaLengkap.message}</p>
                    )}
                </div>

                {/* Email & No HP */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            {...register('email')}
                            id="email"
                            type="email"
                            className="input"
                            placeholder="email@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="noHp" className="block text-sm font-medium text-gray-700 mb-1">No HP</label>
                        <input
                            {...register('noHp')}
                            id="noHp"
                            type="tel"
                            className="input"
                            placeholder="08123456789"
                        />
                    </div>
                </div>

                {/* Jenjang Kelas & Asal Sekolah */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="jenjangKelas" className="block text-sm font-medium text-gray-700 mb-1">
                            Jenjang Kelas
                        </label>
                        <select {...register('jenjangKelas')} id="jenjangKelas" className="input">
                            <option value="">Pilih jenjang kelas</option>
                            <option value="1">Kelas 1</option>
                            <option value="2">Kelas 2</option>
                            <option value="3">Kelas 3</option>
                            <option value="4">Kelas 4</option>
                            <option value="5">Kelas 5</option>
                            <option value="6">Kelas 6</option>
                            <option value="7">Kelas 7</option>
                            <option value="8">Kelas 8</option>
                            <option value="9">Kelas 9</option>
                            <option value="10">Kelas 10</option>
                            <option value="11">Kelas 11</option>
                            <option value="12">Kelas 12</option>
                        </select>
                        {errors.jenjangKelas && (
                            <p className="mt-1 text-sm text-red-600">{errors.jenjangKelas.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="asalSekolah" className="block text-sm font-medium text-gray-700 mb-1">
                            Asal Sekolah
                        </label>
                        <input
                            {...register('asalSekolah')}
                            id="asalSekolah"
                            type="text"
                            className="input"
                            placeholder="Nama sekolah asal"
                            maxLength={255}
                        />
                        {errors.asalSekolah && (
                            <p className="mt-1 text-sm text-red-600">{errors.asalSekolah.message}</p>
                        )}
                    </div>
                </div>

                {/* NIK & NISN */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="nik" className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                        <input
                            {...register('nik')}
                            id="nik"
                            type="text"
                            className="input"
                            placeholder="Nomor Induk Kependudukan"
                            maxLength={16}
                        />
                        {errors.nik && (
                            <p className="mt-1 text-sm text-red-600">{errors.nik.message}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="nisn" className="block text-sm font-medium text-gray-700 mb-1">NISN</label>
                        <input
                            {...register('nisn')}
                            id="nisn"
                            type="text"
                            className="input"
                            placeholder="Nomor Induk Siswa Nasional"
                            maxLength={10}
                        />
                        {errors.nisn && (
                            <p className="mt-1 text-sm text-red-600">{errors.nisn.message}</p>
                        )}
                    </div>
                </div>

                {/* Tempat & Tanggal Lahir */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="tempatLahir" className="block text-sm font-medium text-gray-700 mb-1">
                            Tempat Lahir
                        </label>
                        <input
                            {...register('tempatLahir')}
                            id="tempatLahir"
                            type="text"
                            className="input"
                            placeholder="Kota lahir"
                        />
                    </div>

                    <div>
                        <label htmlFor="tanggalLahir" className="block text-sm font-medium text-gray-700 mb-1">
                            Tanggal Lahir
                        </label>
                        <input
                            {...register('tanggalLahir')}
                            id="tanggalLahir"
                            type="date"
                            className="input"
                        />
                    </div>
                </div>

                {/* Jenis Kelamin & Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="jenisKelamin" className="block text-sm font-medium text-gray-700 mb-1">
                            Jenis Kelamin
                        </label>
                        <select {...register('jenisKelamin')} id="jenisKelamin" className="input">
                            <option value="">Pilih jenis kelamin</option>
                            <option value="Laki-laki">Laki-laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                    </div>

                    <div>
                        <label htmlFor="statusAktif" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select {...register('statusAktif')} id="statusAktif" className="input">
                            <option value="Aktif">Aktif</option>
                            <option value="Non-Aktif">Non-Aktif</option>
                        </select>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Batal
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        isLoading={isLoading}
                    >
                        {isEdit ? 'Update' : 'Simpan'}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
