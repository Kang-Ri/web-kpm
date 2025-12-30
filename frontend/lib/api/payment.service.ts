import api from './client';

export interface PaymentInitiateResponse {
    success: boolean;
    snapToken: string;
    orderId: string;
    amount: number;
    isSimulator: boolean;
}

export interface SimulatePaymentRequest {
    token: string;
    paymentStatus: 'success' | 'pending' | 'failed';
}

export const paymentService = {
    /**
     * Initiate payment and get snap token
     */
    initiatePayment: async (idOrder: number): Promise<PaymentInitiateResponse> => {
        const response = await api.post('/payment/initiate', { idOrder });
        return response.data;
    },

    /**
     * Simulate payment (for testing without real Midtrans)
     */
    simulatePayment: async (token: string, paymentStatus: 'success' | 'pending' | 'failed' = 'success') => {
        const response = await api.post('/payment/simulate', { token, paymentStatus });
        return response.data;
    }
};
