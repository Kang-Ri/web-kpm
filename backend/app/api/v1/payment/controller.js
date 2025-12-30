const { StatusCodes } = require('http-status-codes');
const OrderService = require('../../../services/mysql/order');
const PaymentSimulator = require('../../../services/paymentSimulator');
const AksesMateriService = require('../../../services/mysql/aksesMateri');

/**
 * POST /api/v1/payment/initiate
 * Generate Snap Token (Simulator version)
 */
const initiatePayment = async (req, res, next) => {
    try {
        const { idOrder } = req.body;

        const order = await OrderService.getOrderDetail(idOrder);

        // Generate Mock Snap Token
        const snapToken = await PaymentSimulator.createSnapToken(order);

        res.json({
            success: true,
            snapToken: snapToken.token,
            orderId: snapToken.order_id,
            amount: snapToken.gross_amount,
            isSimulator: true
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/payment/simulate
 * Simulate payment (called by frontend after user confirms in modal)
 */
const simulatePayment = async (req, res, next) => {
    try {
        const { token, paymentStatus } = req.body;

        const notification = await PaymentSimulator.simulatePayment(token, paymentStatus);

        // Process notification (same as webhook)
        await processPaymentNotification(notification);

        res.json({
            success: true,
            message: 'Payment simulated successfully',
            notification
        });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/payment/webhook
 * Payment Notification Handler (for real Midtrans or simulator)
 */
const handleWebhook = async (req, res, next) => {
    try {
        const notification = req.body;
        await processPaymentNotification(notification);
        res.sendStatus(200);
    } catch (error) {
        console.error('Webhook error:', error);
        res.sendStatus(500);
    }
};

/**
 * Helper: Process Payment Notification
 */
const processPaymentNotification = async (notification) => {
    // Extract order ID
    const orderIdParts = notification.order_id.split('-');
    const idOrder = parseInt(orderIdParts[1]);

    const order = await OrderService.getOrderDetail(idOrder);

    // Handle payment status
    if (notification.transaction_status === 'settlement' ||
        notification.transaction_status === 'capture') {

        // Update order status
        await OrderService.updateOrderStatus(idOrder, {
            statusPembayaran: 'Paid',
            midtransTransactionId: notification.transaction_id,
            paymentMethod: notification.payment_type
        });

        console.log(`✅ Payment confirmed for Order #${idOrder}`);

        // Auto-unlock access based on product type
        if (order.product?.jenisProduk === 'Materi') {
            await AksesMateriService.grantAccess({
                body: {
                    idSiswa: order.idSiswa,
                    idProduk: order.idProduk,
                    idOrder: order.idOrder
                }
            });
            console.log(`🔓 Materi access granted for Siswa #${order.idSiswa}`);
        }

        // TODO: Handle Daftar Ulang activation
        // if (order.product?.jenisProduk === 'Daftar Ulang') {
        //     await SiswaKelasService.activateEnrollment(order.idSiswa, order.idOrder);
        // }
    } else if (notification.transaction_status === 'pending') {
        console.log(`⏳ Payment pending for Order #${idOrder}`);
    } else {
        console.log(`❌ Payment failed for Order #${idOrder}`);
    }
};

module.exports = {
    initiatePayment,
    simulatePayment,
    handleWebhook
};
