import apiClient from './client';

export interface MateriButton {
    idButton: number;
    idProduk: number;
    judulButton?: string;
    namaButton: string;
    linkTujuan: string;
    deskripsiButton?: string;
    tanggalPublish?: string;
    tanggalExpire?: string;
    statusButton: 'Active' | 'Inactive';
    orderIndex: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateMateriButtonDto {
    idProduk: number;
    judulButton?: string;
    namaButton: string;
    linkTujuan: string;
    deskripsiButton?: string;
    tanggalPublish?: string;
    tanggalExpire?: string;
    statusButton?: 'Active' | 'Inactive';
    orderIndex?: number;
}

export const materiButtonService = {
    getAll: async (params?: { idProduk?: number; statusButton?: string }): Promise<{ data: MateriButton[] }> => {
        return apiClient.get('/cms/materi-buttons', { params });
    },

    getById: async (id: number): Promise<{ data: MateriButton }> => {
        return apiClient.get(`/cms/materi-buttons/${id}`);
    },

    getActive: async (idProduk: number): Promise<{ data: MateriButton[] }> => {
        return apiClient.get(`/cms/materi/${idProduk}/buttons/active`);
    },

    create: async (data: CreateMateriButtonDto): Promise<{ data: MateriButton }> => {
        return apiClient.post('/cms/materi-buttons', data);
    },

    update: async (id: number, data: Partial<CreateMateriButtonDto>): Promise<{ data: MateriButton }> => {
        return apiClient.patch(`/cms/materi-buttons/${id}`, data);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/materi-buttons/${id}`);
    },

    bulkImport: async (file: File, idParent2: number): Promise<{ data: any }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idParent2', idParent2.toString());

        return apiClient.post('/cms/materi-buttons/bulk-import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Reorder buttons (drag & drop)
    reorder: async (idProduk: number, buttonIds: number[]): Promise<{ message: string }> => {
        return apiClient.patch(`/cms/materi/${idProduk}/buttons/reorder`, { buttonIds });
    },

    // Get analytics for a button (admin)
    getAnalytics: async (idProduk: number, idButton: number): Promise<{ data: any }> => {
        return apiClient.get(`/cms/product/${idProduk}/buttons/${idButton}/analytics`);
    },

    // Track button click (student)
    trackClick: async (idProduk: number, idButton: number): Promise<{ message: string }> => {
        return apiClient.post(`/student/materi/${idProduk}/buttons/${idButton}/click`);
    }
};
