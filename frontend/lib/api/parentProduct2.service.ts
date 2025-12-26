import apiClient from './client';

export interface ParentProduct2 {
    idParent2: number;
    idParent1: number;
    namaParent2: string;
    descParent2?: string;
    tglPublish?: string;
    status: 'Aktif' | 'Non-Aktif';
    tautanProduk: 'Kelas Periodik' | 'Kelas Insidental' | 'Produk Komersial' | '-';
    daftarUlangAktif: boolean;
    kategoriHargaDaftarUlang: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
    hargaDaftarUlang: number;
    idFormDaftarUlang?: number;
    tahunAjaran?: string;
    kapasitasMaksimal?: number;
    jenjangKelasIzin?: string[]; // ["1","2",...,"12"]
}

export interface CreateParentProduct2Dto {
    idParent1: number;
    namaParent2: string;
    descParent2?: string;
    tglPublish?: string;
    status?: 'Aktif' | 'Non-Aktif';
    tautanProduk?: 'Kelas Periodik' | 'Kelas Insidental' | 'Produk Komersial' | '-';
    daftarUlangAktif?: boolean;
    kategoriHargaDaftarUlang?: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
    hargaDaftarUlang?: number;
    idFormDaftarUlang?: number;
    tahunAjaran?: string;
    kapasitasMaksimal?: number;
    jenjangKelasIzin?: string[];
}

export const parentProduct2Service = {
    getAll: async (params?: { idParent1?: number; status?: string }): Promise<{ data: ParentProduct2[] }> => {
        return apiClient.get('/cms/productParent2', { params });
    },

    getById: async (id: number): Promise<{ data: ParentProduct2 }> => {
        return apiClient.get(`/cms/productParent2/${id}`);
    },

    create: async (data: CreateParentProduct2Dto): Promise<{ data: ParentProduct2 }> => {
        return apiClient.post('/cms/productParent2', data);
    },

    update: async (id: number, data: Partial<CreateParentProduct2Dto>): Promise<{ data: ParentProduct2 }> => {
        return apiClient.patch(`/cms/productParent2/${id}`, data);
    },

    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/productParent2/${id}`);
    },

    // Export siswa enrolled in this kelas
    exportSiswa: async (idParent2: number, status?: string): Promise<Blob> => {
        const response = await apiClient.get(`/cms/siswa-kelas/export`, {
            params: { idParent2, status },
            responseType: 'blob',
        });
        return response.data;
    },
};
