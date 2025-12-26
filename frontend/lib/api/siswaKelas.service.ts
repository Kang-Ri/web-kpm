import apiClient from './client';

export interface SiswaKelas {
    idSiswaKelas: number;
    idSiswa: number;
    idParent2: number;
    sudahDaftarUlang: boolean;
    idOrderDaftarUlang?: number | null;
    tanggalDaftarUlang?: string | null;
    statusEnrollment: 'Pending' | 'Aktif' | 'Lulus' | 'Dropout';
    tanggalMasuk?: string;
    tanggalKeluar?: string | null;
    siswa?: {
        idSiswa: number;
        namaLengkap: string;
        email: string;
        noHp?: string;
    };
    ruangKelas?: {
        idParent2: number;
        namaParent2: string;
        tahunAjaran: string;
        kapasitasMaksimal?: number;
    };
}

export interface AvailableStudent {
    idSiswa: number;
    namaLengkap: string;
    email: string;
    jenjangKelas: string;
    asalSekolah?: string;
}

export const siswaKelasService = {
    // Get all enrollments with filters
    getAll: async (params?: { idParent2?: number; idSiswa?: number; statusEnrollment?: string }): Promise<{ data: SiswaKelas[] }> => {
        return apiClient.get('/cms/siswa-kelas', { params });
    },

    // Get single enrollment
    getById: async (id: number): Promise<{ data: SiswaKelas }> => {
        return apiClient.get(`/cms/siswa-kelas/${id}`);
    },

    // Enroll single student
    enroll: async (idSiswa: number, idParent2: number): Promise<{ data: SiswaKelas }> => {
        return apiClient.post('/cms/enrollments', { idSiswa, idParent2 });
    },

    // Bulk enroll students
    bulkEnroll: async (idSiswa: number[], idParent2: number): Promise<{ data: any }> => {
        return apiClient.post('/cms/siswa-kelas/bulk-enroll', { idSiswa, idParent2 });
    },

    // Get available students (not enrolled in class)
    getAvailable: async (idParent2: number, search?: string): Promise<{ data: AvailableStudent[] }> => {
        return apiClient.get('/cms/siswa-kelas/available', {
            params: { idParent2, search }
        });
    },

    // Update enrollment status
    updateStatus: async (id: number, data: { statusEnrollment?: string; sudahDaftarUlang?: boolean }): Promise<{ data: SiswaKelas }> => {
        return apiClient.patch(`/cms/siswa-kelas/${id}`, data);
    },

    // Delete enrollment
    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/siswa-kelas/${id}`);
    },

    // Export to Excel
    exportExcel: async (idParent2: number, statusEnrollment?: string): Promise<Blob> => {
        const response = await apiClient.get('/cms/siswa-kelas/export', {
            params: { idParent2, statusEnrollment },
            responseType: 'blob',
        });
        return response.data;
    },

    // Bulk import siswa from Excel
    bulkImportSiswa: async (file: File, idParent1: number): Promise<{ data: any }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idParent1', idParent1.toString());

        return apiClient.post('/cms/siswa-kelas/bulk-import-siswa', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },

    // Download bulk import template
    downloadImportTemplate: async (idParent1?: number): Promise<Blob> => {
        const response = await apiClient.get('/cms/siswa-kelas/import-template', {
            params: { idParent1 },
            responseType: 'blob',
        });
        return response.data;
    },
};
