import apiClient from './client';

export interface Product {
    idProduk: number;
    idParent2: number;
    namaProduk: string;
    descProduk?: string;
    kategoriHarga: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
    hargaModal: number;
    hargaJual: number;
    jenisProduk: 'Materi' | 'Produk' | 'Lainnya';
    authProduk: 'Umum' | 'Khusus';
    idForm?: number | null;
    refCode?: string;
    statusProduk: 'Draft' | 'Publish' | 'Non-Aktif';
}

export interface CreateProductDto {
    idParent2: number;
    namaProduk: string;
    descProduk?: string;
    kategoriHarga?: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
    hargaModal?: number;
    hargaJual?: number;
    jenisProduk?: 'Materi' | 'Produk' | 'Lainnya';
    authProduk?: 'Umum' | 'Khusus';
    idForm?: number | null;
    refCode?: string;
    statusProduk?: 'Draft' | 'Publish' | 'Non-Aktif';
}

export const productService = {
    getAll: async (params?: { idParent2?: number; statusProduk?: string }): Promise<{ data: Product[] }> => {
        return apiClient.get('/cms/product', { params });
    },

    getById: async (id: number): Promise<{ data: Product }> => {
        return apiClient.get(`/cms/product/${id}`);
    },

    create: async (data: CreateProductDto): Promise<{ data: Product }> => {
        return apiClient.post('/cms/product', data);
    },

    update: async (id: number, data: Partial<CreateProductDto>): Promise<{ data: Product }> => {
        return apiClient.patch(`/cms/product/${id}`, data);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/product/${id}`);
    },
};
