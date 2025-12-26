import apiClient from './client';

export interface UserProfile {
    idUser: number;
    email: string;
    namaLengkap: string;
    role: string;
    siswa?: {
        idSiswa: number;
        nama_lengkap: string;
        email: string;
        no_hp: string;
        tanggal_lahir: string;
        jenis_kelamin: string;
        alamat: string;
        kelas: string;
        nama_ortu: string;
        pekerjaan_ortu: string;
    };
}

export const userService = {
    // Get current user profile with siswa data (for auto-fill)
    getMe: async (): Promise<{ data: UserProfile }> => {
        return apiClient.get('/cms/users/me/full');
    },
};
