'use client';

import { FC, useState } from 'react';
import { X, CheckCircle, Clock, AlertCircle, Loader2, CreditCard, Gift, Heart } from 'lucide-react';
import { siswaService } from '@/lib/api/siswa.service';
import { toast } from 'react-hot-toast';

interface OrderData {
    idOrder: number;
    hargaFinal: number;
    needsPayment: boolean;
    statusPembayaran?: string;
    formData?: Record<string, string>;
}

interface EnrollmentInfo {
    namaKelas: string;
    kategoriHarga: 'Gratis' | 'Seikhlasnya' | 'Bernominal';
    hargaDaftarUlang: number;
    statusEnrollment: string;
}

interface PaymentStatusModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderData: OrderData | null;
    enrollmentInfo: EnrollmentInfo;
    onPaymentSuccess: () => void;
}

export const PaymentStatusModal: FC<PaymentStatusModalProps> = ({
    isOpen,
    onClose,
    orderData,
    enrollmentInfo,
    onPaymentSuccess,
}) => {
    const [isConfirming, setIsConfirming] = useState(false);
    const [isPaid, setIsPaid] = useState(false);
    const [nominalSeikhlasnya, setNominalSeikhlasnya] = useState('');

    const { namaKelas, kategoriHarga, hargaDaftarUlang } = enrollmentInfo;

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const handleDummyPay = async () => {
        if (!orderData?.idOrder) return;

        try {
            setIsConfirming(true);
            const response = await siswaService.dummyConfirmPayment(
                orderData.idOrder,
                nominalSeikhlasnya
            );
            toast.success('Pembayaran berhasil dikonfirmasi!');
            setIsPaid(true);
            setTimeout(() => {
                onPaymentSuccess();
            }, 2000);
        } catch (err: any) {
            console.error('Error confirming payment:', err);
            toast.error(err.response?.data?.message || 'Gagal mengkonfirmasi pembayaran.');
        } finally {
            setIsConfirming(false);
        }
    };

    if (!isOpen) return null;

    // Derived states
    const isPaymentConfirmed = isPaid || orderData?.statusPembayaran === 'Paid' || (orderData && !orderData.needsPayment);
    const isReallyActive = isPaymentConfirmed && enrollmentInfo.statusEnrollment === 'Aktif';
    const isWaitingAdmin = isPaymentConfirmed && enrollmentInfo.statusEnrollment === 'Pending';
    const isSuccessState = isReallyActive || isWaitingAdmin;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className={`px-6 py-5 text-center relative ${
                    isReallyActive
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                        : isWaitingAdmin
                        ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                        : 'bg-gradient-to-br from-blue-600 to-purple-700'
                }`}>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {isReallyActive ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                <CheckCircle className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Pendaftaran Berhasil!</h2>
                            <p className="text-green-100 text-sm mt-1">Anda sekarang terdaftar aktif</p>
                        </div>
                    ) : isWaitingAdmin ? (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                <Clock className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-xl font-bold text-white">Pembayaran Diterima</h2>
                            <p className="text-amber-100 text-sm mt-1">Sedang menunggu verifikasi admin</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-3">
                                {kategoriHarga === 'Gratis' ? (
                                    <Gift className="w-10 h-10 text-white" />
                                ) : kategoriHarga === 'Seikhlasnya' ? (
                                    <Heart className="w-10 h-10 text-white" />
                                ) : (
                                    <CreditCard className="w-10 h-10 text-white" />
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-white">Konfirmasi Pendaftaran</h2>
                            <p className="text-blue-100 text-sm mt-1">{namaKelas}</p>
                        </div>
                    )}
                </div>

                {/* Body */}
                <div className="px-6 py-5">
                    {isReallyActive ? (
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-4">
                                Selamat! Pendaftaran Anda untuk kelas <strong>{namaKelas}</strong> telah berhasil dikonfirmasi.
                            </p>
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
                                ✅ Status: <strong>Aktif</strong>
                            </div>
                        </div>
                    ) : isWaitingAdmin ? (
                        <div className="text-center">
                            <p className="text-gray-600 text-sm mb-4">
                                Pembayaran untuk kelas <strong>{namaKelas}</strong> telah kami terima.
                            </p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex flex-col gap-1 italic">
                                <span>⏳ Status: <strong>Menunggu Konfirmasi</strong></span>
                                <span className="text-[10px] text-amber-600">Admin akan segera memverifikasi pendaftaran Anda.</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Order info */}
                            <div className="bg-gray-50 rounded-xl p-4 mb-4">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-600">Kelas</span>
                                    <span className="font-semibold text-gray-900">{namaKelas}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-600">Kategori</span>
                                    <span className={`font-semibold ${
                                        kategoriHarga === 'Gratis' ? 'text-green-600' :
                                        kategoriHarga === 'Seikhlasnya' ? 'text-blue-600' :
                                        'text-orange-600'
                                    }`}>{kategoriHarga}</span>
                                </div>
                                {kategoriHarga === 'Bernominal' && (
                                    <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                                        <span className="text-gray-700 font-medium">Total</span>
                                        <span className="text-xl font-bold text-orange-600">
                                            {formatRupiah(hargaDaftarUlang)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Seikhlasnya input */}
                            {kategoriHarga === 'Seikhlasnya' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nominal Donasi (opsional)
                                    </label>
                                    <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-300">
                                        <span className="px-3 py-2 bg-gray-100 text-gray-500 text-sm border-r border-gray-300">Rp</span>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0 (Seikhlasnya)"
                                            value={nominalSeikhlasnya}
                                            onChange={e => setNominalSeikhlasnya(e.target.value)}
                                            className="flex-1 px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">Masukkan 0 jika tidak ingin berdonasi</p>
                                </div>
                            )}

                            {/* Dev mode badge */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700">
                                    <strong>Dev Mode:</strong> Tombol di bawah mensimulasikan pembayaran tanpa gateway sungguhan.
                                </p>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <span>Menunggu konfirmasi pembayaran...</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 pb-5 flex gap-3">
                    {isSuccessState ? (
                        <button
                            onClick={onClose}
                            className={`w-full py-3 text-white font-semibold rounded-xl transition-all ${
                                isReallyActive 
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                            }`}
                        >
                            Tutup
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={onClose}
                                disabled={isConfirming}
                                className="flex-1 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                            >
                                Bayar Nanti
                            </button>
                            <button
                                onClick={handleDummyPay}
                                disabled={isConfirming}
                                className="flex-1 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isConfirming ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                                ) : (
                                    <>🔵 Simulasi Bayar</>
                                )}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
