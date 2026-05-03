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

export interface PaginatedUserResponse {
    data: UserProfile[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
}

export const userService = {
    // Get current user profile with siswa data (for auto-fill)
    getMe: async (): Promise<{ data: UserProfile }> => {
        return apiClient.get('/cms/users/me/full');
    },

    getAllUsers: async (params?: { search?: string; role?: string; page?: number; limit?: number }): Promise<{ data: PaginatedUserResponse }> => {
        return apiClient.get('/cms/users', { params });
    },

    createUser: async (data: any): Promise<{ data: UserProfile }> => {
        return apiClient.post('/cms/users', data);
    },

    updateUser: async (id: number, data: any): Promise<{ data: UserProfile }> => {
        return apiClient.patch(`/cms/users/${id}`, data);
    },

    deleteUser: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/users/${id}`);
    },
};
