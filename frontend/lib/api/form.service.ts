import apiClient from './client';

export interface Form {
    idForm: number;
    namaForm: string;
    descForm: string | null;
    statusForm: 'Aktif' | 'Non-Aktif' | 'Draft';
    tglDibuat: string;
    fields?: FormField[];
    products?: {
        idProduk: number;
        namaProduk: string;
        hargaModal: number;
        hargaJual: number;
    }[];
}

export interface FormField {
    idField: number;
    idForm: number;
    namaField: string;
    tipeField: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'date';
    nilaiPilihan: string | null;
    required: boolean;
    textDescription: string | null;
    textWarning: string | null;
    placeholder: string | null;
    orderIndex: number;
}

export const formService = {
    // Get all forms
    getAll: async (): Promise<{ data: Form[] }> => {
        return apiClient.get('/cms/forms');
    },

    // Get form by ID (with fields)
    getById: async (idForm: number): Promise<{ data: Form }> => {
        return apiClient.get(`/cms/forms/${idForm}`);
    },

    // Create new form
    create: async (data: { namaForm: string; descForm?: string; statusForm?: string }): Promise<{ data: Form }> => {
        return apiClient.post('/cms/forms', data);
    },

    // Update form
    update: async (idForm: number, data: { namaForm?: string; descForm?: string; statusForm?: string }): Promise<{ data: Form }> => {
        return apiClient.patch(`/cms/forms/${idForm}`, data);
    },

    // Delete form
    delete: async (idForm: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/forms/${idForm}`);
    },

    // Duplicate form (future)
    duplicate: async (idForm: number): Promise<{ data: Form }> => {
        return apiClient.post(`/cms/forms/${idForm}/duplicate`);
    },

    // Submit form (student)
    submitForm: async (idForm: number, data: { idSiswa?: number; responses: Record<string, any> }): Promise<{ success: boolean; message: string; data: { idOrder: number; statusOrder: string } }> => {
        return apiClient.post(`/cms/forms/${idForm}/submit`, data);
    },
};

export const formFieldService = {
    // Get fields by form ID
    getByForm: async (idForm: number): Promise<{ data: FormField[] }> => {
        return apiClient.get(`/cms/forms/${idForm}/fields`);
    },

    // Add field to form
    create: async (idForm: number, data: Partial<FormField>): Promise<{ data: FormField }> => {
        return apiClient.post(`/cms/forms/${idForm}/fields`, data);
    },

    // Update field
    update: async (idField: number, data: Partial<FormField>): Promise<{ data: FormField }> => {
        return apiClient.patch(`/cms/form-fields/${idField}`, data);
    },

    // Delete field
    delete: async (idField: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/form-fields/${idField}`);
    },

    // Reorder fields
    reorder: async (idForm: number, fieldOrders: { idField: number; orderIndex: number }[]): Promise<{ message: string }> => {
        return apiClient.patch(`/cms/forms/${idForm}/fields/reorder`, { fieldOrders });
    },
};
