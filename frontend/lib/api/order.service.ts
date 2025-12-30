import api from './api';

export interface Order {
    idOrder: number;
    idUser: number;
    idProduk: number;
    namaProduk: string;
    hargaProduk: number;
    namaPembeli: string;
    emailPembeli: string;
    noHpPembeli: string;
    jumlahBeli: number;
    hargaTransaksi: number;
    diskon: number;
    hargaFinal: number;
    statusOrder: string;
    statusPembayaran: string;
    tglOrder: string;
    paidAt?: string;
    midtransTransactionId?: string;
    paymentMethod?: string;
}

export const orderService = {
    getAll: (params?: any) => api.get('/cms/order', { params }),
    getById: (id: number) => api.get(`/cms/order/${id}`),
    updateStatus: (id: number, data: any) => api.patch(`/cms/order/${id}/status`, data),
};
