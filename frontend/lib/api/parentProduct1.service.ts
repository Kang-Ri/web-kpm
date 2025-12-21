import apiClient from './client';

export interface ParentProduct1 {
    idParent1: number;
    namaParent1: string;
    descParent1?: string;
    tglPublish?: string;
    status: 'Aktif' | 'Non-Aktif';
    tautanProduk: 'Kelas Periodik' | 'Kelas Insidental' | 'Produk Komersial' | '-';
}

export interface CreateParentProduct1Dto {
    namaParent1: string;
    descParent1?: string;
    tglPublish?: string;
    status?: 'Aktif' | 'Non-Aktif';
    tautanProduk?: 'Kelas Periodik' | 'Kelas Insidental' | 'Produk Komersial' | '-';
}

export const parentProduct1Service = {
    getAll: async (params?: { tautanProduk?: string; status?: string }): Promise<{ data: ParentProduct1[] }> => {
        return apiClient.get('/cms/productParent1', { params });
    },

    getById: async (id: number): Promise<{ data: ParentProduct1 }> => {
        return apiClient.get(`/cms/productParent1/${id}`);
    },

    create: async (data: CreateParentProduct1Dto): Promise<{ data: ParentProduct1 }> => {
        return apiClient.post('/cms/productParent1', data);
    },

    update: async (id: number, data: Partial<CreateParentProduct1Dto>): Promise<{ data: ParentProduct1 }> => {
        return apiClient.patch(`/cms/productParent1/${id}`, data);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/productParent1/${id}`);
    },
};
