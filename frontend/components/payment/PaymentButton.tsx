'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { paymentService } from '@/lib/api/payment.service';
import { showSuccess, showError } from '@/lib/utils/toast';
import PaymentSimulatorModal from './PaymentSimulatorModal';

interface PaymentButtonProps {
    idOrder: number;
    amount: number;
    disabled?: boolean;
    onSuccess?: () => void;
}

export default function PaymentButton({
    idOrder,
    amount,
    disabled = false,
    onSuccess
}: PaymentButtonProps) {
    const [loading, setLoading] = useState(false);
    const [showSimulator, setShowSimulator] = useState(false);
    const [snapToken, setSnapToken] = useState<string>('');
    const [orderIdStr, setOrderIdStr] = useState<string>('');

    const handlePayment = async () => {
        try {
            setLoading(true);

            // Get Snap Token
            const response = await paymentService.initiatePayment(idOrder);

            if (response.isSimulator) {
                // Open simulator modal
                setSnapToken(response.snapToken);
                setOrderIdStr(response.orderId);
                setShowSimulator(true);
            } else {
                // TODO: Open real Midtrans Snap popup
                // (window as any).snap.pay(response.snapToken, { ... });
                showError('Real Midtrans not configured yet');
            }
        } catch (error: any) {
            showError(error.message || 'Gagal memulai pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        try {
            // Simulate payment
            await paymentService.simulatePayment(snapToken, 'success');
            showSuccess('Pembayaran berhasil! Akses telah dibuka.');
            onSuccess?.();
        } catch (error: any) {
            showError('Gagal memproses pembayaran');
        }
    };

    const handlePaymentPending = async () => {
        try {
            await paymentService.simulatePayment(snapToken, 'pending');
            showSuccess('Pembayaran pending, menunggu konfirmasi');
        } catch (error: any) {
            showError('Gagal memproses pembayaran');
        }
    };

    const handlePaymentFailed = async () => {
        try {
            await paymentService.simulatePayment(snapToken, 'failed');
            showError('Pembayaran gagal!');
        } catch (error: any) {
            showError('Gagal memproses pembayaran');
        }
    };

    return (
        <>
            <Button
                variant="primary"
                onClick={handlePayment}
                isLoading={loading}
                disabled={disabled || loading}
                className="w-full"
            >
                Bayar Rp {amount.toLocaleString('id-ID')}
            </Button>

            <PaymentSimulatorModal
                isOpen={showSimulator}
                onClose={() => setShowSimulator(false)}
                orderId={orderIdStr}
                amount={amount}
                onSuccess={handlePaymentSuccess}
                onPending={handlePaymentPending}
                onFailed={handlePaymentFailed}
            />
        </>
    );
}
