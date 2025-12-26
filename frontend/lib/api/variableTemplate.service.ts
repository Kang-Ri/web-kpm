import apiClient from './client';

export interface VariableTemplate {
    idTemplate: number;
    namaVariable: string;
    label: string;
    description?: string;
    category: 'personal' | 'academic' | 'contact' | 'other';
    color: string;
    orderIndex: number;
}

export const variableTemplateService = {
    // Get all templates
    getAll: async (): Promise<{ data: VariableTemplate[] }> => {
        return apiClient.get('/cms/variable-templates');
    },

    // Get one template
    getById: async (id: number): Promise<{ data: VariableTemplate }> => {
        return apiClient.get(`/cms/variable-templates/${id}`);
    },

    // Create template
    create: async (data: Partial<VariableTemplate>): Promise<{ data: VariableTemplate }> => {
        return apiClient.post('/cms/variable-templates', data);
    },

    // Update template
    update: async (id: number, data: Partial<VariableTemplate>): Promise<{ data: VariableTemplate }> => {
        return apiClient.patch(`/cms/variable-templates/${id}`, data);
    },

    // Delete template
    delete: async (id: number): Promise<{ message: string }> => {
        return apiClient.delete(`/cms/variable-templates/${id}`);
    },

    // Reorder templates
    reorder: async (templates: { idTemplate: number; orderIndex: number }[]): Promise<{ message: string }> => {
        return apiClient.patch('/cms/variable-templates/reorder', { templates });
    },
};
