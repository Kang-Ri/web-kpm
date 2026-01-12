import apiClient from './client';

export interface Siswa {
    idSiswa: number;
    idUser?: number;
    namaLengkap: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: 'Laki-laki' | 'Perempuan';
    jenjangKelas?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
    asalSekolah?: string;
    nik?: string;
    nisn?: string;
    noHp?: string;
    email?: string;
    statusAktif: 'Aktif' | 'Non-Aktif';
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateSiswaDto {
    idUser?: number;
    namaLengkap: string;
    tempatLahir?: string;
    tanggalLahir?: string;
    jenisKelamin?: 'Laki-laki' | 'Perempuan';
    jenjangKelas?: '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12';
    asalSekolah?: string;
    nik?: string;
    nisn?: string;
    noHp?: string;
    email?: string;
    statusAktif?: 'Aktif' | 'Non-Aktif';
}

export interface BulkImportResponse {
    success: Array<{
        row: number;
        namaLengkap: string;
        email: string;
    }>;
    failed: Array<{
        row: number;
        namaLengkap: string;
        email: string;
        error: string;
    }>;
    total: number;
}

export interface BulkDeleteResponse {
    success: Array<{
        idSiswa: number;
        namaLengkap: string;
    }>;
    failed: Array<{
        idSiswa: number;
        error: string;
    }>;
    total: number;
}

export const siswaService = {
    getAll: async (params?: { statusAktif?: string; kota?: string }): Promise<{ data: Siswa[] }> => {
        return apiClient.get('/cms/siswa', { params });
    },

    getById: async (id: number): Promise<{ data: Siswa }> => {
        return apiClient.get(`/cms/siswa/${id}`);
    },

    create: async (data: CreateSiswaDto): Promise<{ data: Siswa }> => {
        return apiClient.post('/cms/siswa', data);
    },

    update: async (id: number, data: Partial<CreateSiswaDto>): Promise<{ data: Siswa }> => {
        return apiClient.patch(`/cms/siswa/${id}`, data);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/siswa/${id}`);
    },

    bulkImport: async (file: File): Promise<{ data: BulkImportResponse }> => {
        const formData = new FormData();
        formData.append('file', file);

        return apiClient.post('/cms/siswa/bulk-import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    bulkDelete: async (ids: number[]): Promise<{ data: BulkDeleteResponse }> => {
        return apiClient.delete('/cms/siswa/bulk-delete', {
            data: { ids },
        });
    },

    exportData: async (): Promise<Blob> => {
        const response = await apiClient.get('/cms/siswa/export', {
            responseType: 'blob',
        });
        return response.data;
    },


    resetPassword: async (id: number): Promise<{ message: string }> => {
        return apiClient.post(`/cms/siswa/${id}/reset-password`);
    },

    // === ENROLLMENT METHODS ===

    getEnrollmentDashboard: async (idSiswa: number) => {
        return apiClient.get(`/cms/siswa/${idSiswa}/enrollment-dashboard`);
    },

    getParent2List: async (idSiswa: number, idParent1: number) => {
        return apiClient.get(`/cms/siswa/${idSiswa}/parent1/${idParent1}/parent2`);
    },

    completeProfile: async (idSiswa: number, data: any) => {
        return apiClient.patch(`/cms/siswa/${idSiswa}/complete-profile`, data);
    },
};
