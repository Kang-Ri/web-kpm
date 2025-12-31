'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { aksesMateriService } from '@/lib/api/aksesMateri.service';
import { orderService } from '@/lib/api/order.service';
import { showSuccess, showError } from '@/lib/utils/toast';

interface Order {
    idOrder: number;
    hargaFinal: number;
    statusPembayaran: string;
    tglOrder: string;
    paidAt?: string;
}

interface Siswa {
    idSiswa: number;
    namaLengkap: string;
    email: string;
    noHp?: string;
}

interface AksesMateri {
    idAksesMateri: number;
    statusAkses: string;
    tanggalAkses: string;
    siswa: Siswa;
    order?: Order;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    idProduk: number;
    namaProduk: string;
}

export default function MateriPaymentStatusModal({ isOpen, onClose, idProduk, namaProduk }: Props) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AksesMateri[]>([]);
    const [filter, setFilter] = useState<string>('all');
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen && idProduk) {
            fetchData();
        }
    }, [isOpen, idProduk]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await aksesMateriService.getByProduct(idProduk);
            setData(response.data.data || []);
        } catch (error: any) {
            showError('Gagal memuat data siswa');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (idOrder: number, newStatus: string) => {
        try {
            setUpdatingId(idOrder);
            await orderService.updatePaymentStatus(idOrder, newStatus);
            showSuccess(`Status pembayaran berhasil diupdate ke ${newStatus}`);
            await fetchData(); // Refresh data
        } catch (error: any) {
            showError('Gagal update status pembayaran');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleRevokeAccess = async (idAkses: number) => {
        if (!confirm('Yakin ingin revoke access? Siswa tidak bisa akses materi (record tetap ada).')) {
            return;
        }

        try {
            setUpdatingId(idAkses);
            await aksesMateriService.revoke(idAkses);
            showSuccess('Access berhasil di-revoke (Locked)');
            await fetchData(); // Refresh data
        } catch (error: any) {
            showError('Gagal revoke access');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDeleteAccess = async (idAkses: number) => {
        if (!confirm('Yakin ingin DELETE access? Siswa harus bayar lagi untuk dapat akses!')) {
            return;
        }

        try {
            setUpdatingId(idAkses);
            await aksesMateriService.delete(idAkses);
            showSuccess('Access berhasil dihapus. Siswa harus bayar lagi.');
            await fetchData(); // Refresh data
        } catch (error: any) {
            showError('Gagal delete access');
            console.error(error);
        } finally {
            setUpdatingId(null);
        }
    };

    const getFilteredData = () => {
        if (filter === 'all') return data;
        return data.filter(item => {
            if (filter === 'paid') return item.order?.statusPembayaran === 'Paid';
            if (filter === 'unpaid') return item.order?.statusPembayaran === 'Unpaid';
            if (filter === 'no-order') return !item.order;
            return true;
        });
    };

    const getStatusBadge = (status?: string) => {
        if (!status) {
            return (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    <XCircle className="w-3 h-3 mr-1" />
                    No Order
                </span>
            );
        }

        switch (status) {
            case 'Paid':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Paid
                    </span>
                );
            case 'Unpaid':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        <XCircle className="w-3 h-3 mr-1" />
                        Unpaid
                    </span>
                );
            case 'Pending':
                return (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                    </span>
                );
            default:
                return <span className="text-xs text-gray-500">{status}</span>;
        }
    };

    if (!isOpen) return null;

    const filteredData = getFilteredData();

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Payment Status</h2>
                        <p className="text-sm text-gray-600 mt-1">{namaProduk}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Filter */}
                <div className="p-4 border-b bg-gray-50">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Semua ({data.length})
                        </button>
                        <button
                            onClick={() => setFilter('paid')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'paid'
                                ? 'bg-green-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Paid ({data.filter(d => d.order?.statusPembayaran === 'Paid').length})
                        </button>
                        <button
                            onClick={() => setFilter('unpaid')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'unpaid'
                                ? 'bg-red-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            Unpaid ({data.filter(d => d.order?.statusPembayaran === 'Unpaid').length})
                        </button>
                        <button
                            onClick={() => setFilter('no-order')}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'no-order'
                                ? 'bg-gray-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            No Order ({data.filter(d => !d.order).length})
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading...</div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            Tidak ada data siswa
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-gray-50">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">No</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Siswa</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Harga</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Pembayaran</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Order</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredData.map((item, index) => (
                                        <tr key={`${item.siswa.idSiswa}-${item.idAksesMateri || 'null'}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {item.siswa?.namaLengkap || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item.siswa?.email || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900">
                                                {item.order?.hargaFinal
                                                    ? `Rp ${item.order.hargaFinal.toLocaleString('id-ID')}`
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(item.order?.statusPembayaran)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {item.order?.tglOrder
                                                    ? new Date(item.order.tglOrder).toLocaleDateString('id-ID')
                                                    : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {item.order && item.order.statusPembayaran === 'Unpaid' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(item.order!.idOrder, 'Paid')}
                                                        disabled={updatingId === item.order.idOrder}
                                                        className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {updatingId === item.order.idOrder ? 'Updating...' : 'Mark Paid'}
                                                    </button>
                                                )}
                                                {item.order && item.order.statusPembayaran === 'Paid' && item.idAksesMateri && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleRevokeAccess(item.idAksesMateri!)}
                                                            disabled={updatingId === item.idAksesMateri}
                                                            className="px-3 py-1 text-xs font-medium text-white bg-orange-600 rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Lock access (siswa masih punya record)"
                                                        >
                                                            {updatingId === item.idAksesMateri ? 'Revoking...' : 'Revoke'}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteAccess(item.idAksesMateri!)}
                                                            disabled={updatingId === item.idAksesMateri}
                                                            className="px-3 py-1 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            title="Delete access (siswa harus bayar lagi)"
                                                        >
                                                            {updatingId === item.idAksesMateri ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}
