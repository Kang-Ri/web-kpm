import apiClient from './client';

export interface Product {
    idProduk: number;
    idParent2: number;
    namaProduk: string;
    descProduk: string;
    kategoriHarga: string;
    hargaModal: number;
    hargaJual: number;
    jenisProduk: string;
    authProduk: string;
    refCode: string;
    statusProduk: string;
    tanggalPublish: string | null;
    idForm?: number;
    // Inventory fields - required with defaults
    stokProduk: number;
    trackInventory: boolean;
    minStokAlert: number;
    produkDigital: boolean;
    // Discount fields - required with defaults
    hargaSaran: number;
    diskonAktif: boolean;
    tipeDiskon: 'percentage' | 'nominal';
    nilaiDiskon: number;
    hargaAkhir: number;
    diskonMulai: string | null;
    diskonBerakhir: string | null;
    // Relations
    customForm?: {
        idForm: number;
        namaForm: string;
    };
    parentProduct2?: any;
}

export interface CreateProductDto {
    idParent2: number;
    namaProduk: string;
    descProduk?: string;
    kategoriHarga?: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
    hargaModal?: number;
    hargaJual?: number;
    jenisProduk?: 'Materi' | 'Produk' | 'Daftar Ulang' | 'Lainnya';
    authProduk?: 'Umum' | 'Khusus';
    idForm?: number | null;
    refCode?: string;
    statusProduk?: 'Draft' | 'Publish' | 'Non-Aktif';
    tanggalPublish?: string | null;
    // Inventory fields - optional for DTO
    stokProduk?: number;
    trackInventory?: boolean;
    minStokAlert?: number;
    produkDigital?: boolean;
    // Discount fields - optional for DTO
    hargaSaran?: number;
    diskonAktif?: boolean;
    tipeDiskon?: 'percentage' | 'nominal';
    nilaiDiskon?: number;
    hargaAkhir?: number;
    diskonMulai?: string | null;
    diskonBerakhir?: string | null;
}

export const productService = {
    getAll: async (params?: { idParent2?: number; statusProduk?: string; jenisProduk?: string }): Promise<{ data: Product[] }> => {
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

    importMateri: async (file: File, idParent2: number): Promise<{ data: any }> => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('idParent2', idParent2.toString());

        return apiClient.post('/cms/product/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    bulkImportMateri: async (file: File): Promise<{ data: any }> => {
        const formData = new FormData();
        formData.append('file', file);

        return apiClient.post('/cms/product/bulk-import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Analytics
    getAnalytics: async (idProduk: number): Promise<{ data: any }> => {
        return apiClient.get(`/cms/product/${idProduk}/analytics`);
    }
};
