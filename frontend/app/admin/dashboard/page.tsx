'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layouts';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Users, GraduationCap, ShoppingBag, Loader2 } from 'lucide-react';
import { orderService, Order } from '@/lib/api/order.service';

export default function AdminDashboardPage() {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [stats, setStats] = useState([
        { label: 'Total Transaksi', value: '0', icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
        { label: 'Siswa Terdaftar (Est)', value: '0', icon: Users, color: 'bg-green-100 text-green-600' },
        { label: 'Produk/Materi Terjual', value: '0', icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600' },
    ]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setIsLoading(true);
            try {
                // Fetch recent orders
                const res = await orderService.getAll();
                const orders: Order[] = res.data.data;
                
                // We'll just slice the latest 10 orders for the "Recent Transactions" table
                setRecentOrders(orders.slice(0, 10));

                // Quick mock calculation for basic DB Stats based on order history
                // (In a real massive app, you'd use a dedicated /cms/stats endpoint)
                const paidOrders = orders.filter(o => o.statusPembayaran === 'Paid');
                
                setStats([
                    { label: 'Total Transaksi (Semua)', value: orders.length.toString(), icon: ShoppingBag, color: 'bg-blue-100 text-blue-600' },
                    { label: 'Transaksi Paid', value: paidOrders.length.toString(), icon: Users, color: 'bg-green-100 text-green-600' },
                    { label: 'Pendapatan (Est)', value: `Rp ${paidOrders.reduce((sum, o) => sum + (Number(o.hargaFinal) || 0), 0).toLocaleString('id-ID')}`, icon: GraduationCap, color: 'bg-indigo-100 text-indigo-600' },
                ]);

            } catch (error) {
                console.error("Gagal mengambil data dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const formatCurrency = (amount: number | string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(Number(amount));
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Admin</h1>
                    <p className="text-gray-600 mt-1">Pantau seluruh aktivitas transaksi dan pendaftaran secara riil.</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat, index) => (
                        <Card key={index} hover>
                            <CardBody>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{isLoading ? <Loader2 className="w-5 h-5 animate-spin text-gray-400" /> : stat.value}</p>
                                    </div>
                                    <div className={`w-14 h-14 rounded-lg flex items-center justify-center ${stat.color}`}>
                                        <stat.icon className="h-7 w-7" />
                                    </div>
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>

                {/* Recent Transactions Table */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-semibold text-gray-900">Riwayat Transaksi Terbaru</h2>
                    </CardHeader>

                    <CardBody className="p-0">
                        {isLoading ? (
                            <div className="flex justify-center items-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-[#0e7490]" />
                                <span className="ml-3 text-gray-500">Memuat transaksi...</span>
                            </div>
                        ) : recentOrders.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>ID Order</th>
                                            <th>Nama Pembeli</th>
                                            <th>Produk / Materi</th>
                                            <th>Tanggal</th>
                                            <th>Nominal</th>
                                            <th>Status Pembayaran</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.map((order) => (
                                            <tr key={order.idOrder}>
                                                <td className="font-medium text-gray-900">#{order.idOrder}</td>
                                                <td>
                                                    <div className="font-medium">{order.namaPembeli}</div>
                                                    <div className="text-xs text-gray-500">{order.emailPembeli || '-'}</div>
                                                </td>
                                                <td className="max-w-[200px] truncate" title={(order as any).product?.namaProduk || order.namaProduk}>
                                                    {(order as any).product?.namaProduk || order.namaProduk || 'Unknown Product'}
                                                </td>
                                                <td>{new Date(order.tglOrder).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit' })}</td>
                                                <td className="font-medium">{formatCurrency(order.hargaFinal)}</td>
                                                <td>
                                                    <Badge variant={order.statusPembayaran === 'Paid' ? 'success' : 'warning'}>
                                                        {order.statusPembayaran}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                Belum ada transaksi yang tercatat.
                            </div>
                        )}
                    </CardBody>
                </Card>
            </div>
        </DashboardLayout>
    );
}
