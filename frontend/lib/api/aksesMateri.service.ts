import api from './client';

export const aksesMateriService = {
    getAll: (params?: any) => api.get('/cms/akses-materi', { params }),
    getByProduct: (idProduk: number) => api.get(`/cms/materi/${idProduk}/siswa`),
    grant: (data: any) => api.post('/cms/akses-materi/grant', data),
    revoke: (id: number) => api.patch(`/cms/akses-materi/${id}/revoke`),
    delete: (id: number) => api.delete(`/cms/akses-materi/${id}`),
};
