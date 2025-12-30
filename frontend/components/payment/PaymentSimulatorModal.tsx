'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';

interface PaymentSimulatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    orderId: string;
    amount: number;
    onSuccess: () => void;
    onPending: () => void;
    onFailed: () => void;
}

export default function PaymentSimulatorModal({
    isOpen,
    onClose,
    orderId,
    amount,
    onSuccess,
    onPending,
    onFailed
}: PaymentSimulatorModalProps) {
    const [processing, setProcessing] = useState(false);

    const handlePayment = async (status: 'success' | 'pending' | 'failed') => {
        setProcessing(true);

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        setProcessing(false);
        onClose();

        if (status === 'success') {
            onSuccess();
        } else if (status === 'pending') {
            onPending();
        } else {
            onFailed();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payment Simulator" size="md">
            <div className="space-y-6">
                {/* Order Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Order ID:</span>
                        <span className="font-mono text-sm font-semibold">{orderId}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Amount:</span>
                        <span className="text-2xl font-bold text-blue-600">
                            Rp {amount.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {/* Simulator Notice */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <CreditCard className="w-5 h-5 text-yellow-600 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-yellow-800">Payment Simulator Mode</p>
                            <p className="text-xs text-yellow-700 mt-1">
                                Choose payment result to test different scenarios
                            </p>
                        </div>
                    </div>
                </div>

                {/* Payment Buttons */}
                <div className="space-y-3">
                    <Button
                        variant="primary"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => handlePayment('success')}
                        isLoading={processing}
                        disabled={processing}
                    >
                        <CheckCircle className="w-5 h-5" />
                        Simulate Success Payment
                    </Button>

                    <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
                        onClick={() => handlePayment('pending')}
                        isLoading={processing}
                        disabled={processing}
                    >
                        <Clock className="w-5 h-5" />
                        Simulate Pending Payment
                    </Button>

                    <Button
                        variant="secondary"
                        className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-800"
                        onClick={() => handlePayment('failed')}
                        isLoading={processing}
                        disabled={processing}
                    >
                        <XCircle className="w-5 h-5" />
                        Simulate Failed Payment
                    </Button>
                </div>

                <div className="pt-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
