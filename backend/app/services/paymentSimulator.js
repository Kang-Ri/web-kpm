const Order = require('../../api/v1/order/model');

/**
 * Mock Payment Service (Simulator)
 * Mimics Midtrans behavior for development/testing
 */

/**
 * Generate Mock Snap Token
 */
const createSnapToken = async (order, siswa) => {
    // Generate a fake token (format mirip Midtrans)
    const mockToken = `SIM-${order.idOrder}-${Date.now()}`;

    return {
        token: mockToken,
        redirect_url: null, // Simulator uses modal, not redirect
        order_id: `ORDER-${order.idOrder}`,
        gross_amount: order.hargaFinal
    };
};

/**
 * Simulate Payment Result
 * Called by frontend after user clicks "Pay" in simulator modal
 */
const simulatePayment = async (token, paymentStatus = 'success') => {
    // Extract order ID from token
    const parts = token.split('-');
    const idOrder = parseInt(parts[1]);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return mock notification (sama seperti Midtrans webhook)
    return {
        transaction_status: paymentStatus === 'success' ? 'settlement' :
            paymentStatus === 'pending' ? 'pending' : 'deny',
        order_id: `ORDER-${idOrder}`,
        transaction_id: `TRX-SIM-${Date.now()}`,
        payment_type: 'simulator',
        gross_amount: 0 // Will be filled from order
    };
};

module.exports = {
    createSnapToken,
    simulatePayment
};
