'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import PaymentButton from '@/components/payment/PaymentButton';
import { orderService } from '@/lib/api/order.service';
import { showError } from '@/lib/utils/toast';
import { RefreshCw } from 'lucide-react';

interface Order {
    idOrder: number;
    namaProduk: string;
    namaPembeli: string;
    emailPembeli: string;
    hargaFinal: number;
    statusPembayaran: string;
    statusOrder: string;
    tglOrder: string;
}

export default function PaymentTestPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await orderService.getAll();
            const data = response.data.data || response.data;
            setOrders(data);
        } catch (error: any) {
            showError('Gagal memuat orders');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handlePaymentSuccess = () => {
        // Refresh orders after payment
        setTimeout(() => {
            fetchOrders();
        }, 1000);
    };

    return (
        <div className="container mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Payment Test Page</h1>
                <p className="text-gray-600 mt-2">
                    Test payment simulator dengan orders yang ada
                </p>
            </div>

            {/* Info Card */}
            <Card className="mb-6 bg-blue-50 border-blue-200">
                <div className="p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Cara Testing:</h3>
                    <ol className="text-sm text-blue-800 space-y-1 ml-4 list-decimal">
                        <li>Pilih order dengan status "Unpaid"</li>
                        <li>Click tombol "Bayar"</li>
                        <li>Simulator modal akan muncul</li>
                        <li>Pilih hasil payment (Success/Pending/Failed)</li>
                        <li>Cek status order berubah</li>
                    </ol>
                </div>
            </Card>

            {/* Refresh Button */}
            <div className="mb-4 flex justify-end">
                <button
                    onClick={fetchOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
                    disabled={loading}
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* Orders List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        Belum ada order. Buat order dari halaman daftar ulang atau beli materi.
                    </div>
                ) : (
                    orders.map((order) => (
                        <Card key={order.idOrder} className="overflow-hidden">
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Order ID</p>
                                        <p className="font-mono font-semibold text-gray-900">
                                            #{order.idOrder}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Tanggal</p>
                                        <p className="text-sm text-gray-700">
                                            {new Date(order.tglOrder).toLocaleDateString('id-ID', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mb-4">
                                    <p className="text-sm font-semibold text-gray-900 mb-2">
                                        {order.namaProduk}
                                    </p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="text-gray-500">Pembeli:</span>
                                            <span className="ml-2 text-gray-900">{order.namaPembeli}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500">Email:</span>
                                            <span className="ml-2 text-gray-900">{order.emailPembeli}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t pt-4">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-xs text-gray-500">Total</p>
                                            <p className="text-xl font-bold text-blue-600">
                                                Rp {order.hargaFinal.toLocaleString('id-ID')}
                                            </p>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <Badge
                                                variant={
                                                    order.statusPembayaran === 'Paid'
                                                        ? 'success'
                                                        : order.statusPembayaran === 'Unpaid'
                                                            ? 'warning'
                                                            : 'default'
                                                }
                                            >
                                                {order.statusPembayaran}
                                            </Badge>
                                            <Badge variant="default" className="text-xs">
                                                {order.statusOrder}
                                            </Badge>
                                        </div>
                                    </div>

                                    {order.statusPembayaran === 'Unpaid' && (
                                        <div className="w-64">
                                            <PaymentButton
                                                idOrder={order.idOrder}
                                                amount={order.hargaFinal}
                                                onSuccess={handlePaymentSuccess}
                                            />
                                        </div>
                                    )}

                                    {order.statusPembayaran === 'Paid' && (
                                        <Badge variant="success" className="px-6 py-2">
                                            ✓ Sudah Dibayar
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
