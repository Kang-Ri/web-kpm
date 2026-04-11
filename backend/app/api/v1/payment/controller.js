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
            const Siswa = require('../siswa/model');
            const targetSiswa = await Siswa.findOne({ where: { idUser: order.idUser } });
            if (targetSiswa) {
                await AksesMateriService.grantAccess({
                    body: {
                        idSiswa: targetSiswa.idSiswa,
                        idProduk: order.idProduk,
                        idOrder: order.idOrder
                    }
                });
                console.log(`🔓 Materi access granted for Siswa #${targetSiswa.idSiswa}`);
            }
        }

        // Handle Daftar Ulang activation
        const SiswaKelas = require('../siswaKelas/model');
        await SiswaKelas.update(
            { statusEnrollment: 'Aktif', tanggalMasuk: new Date() },
            { where: { idOrderDaftarUlang: idOrder } }
        );
        console.log(`✅ SiswaKelas activated for Order #${idOrder}`);
    } else if (notification.transaction_status === 'pending') {
        console.log(`⏳ Payment pending for Order #${idOrder}`);
    } else {
        console.log(`❌ Payment failed for Order #${idOrder}`);
    }
};

/**
 * POST /api/v1/payment/dummy-confirm/:idOrder
 * Dummy payment confirmation for enrollment (Dev Mode - no Midtrans)
 */
const dummyConfirmEnrollment = async (req, res, next) => {
    try {
        const { idOrder } = req.params;
        const Order = require('../order/model');
        const SiswaKelas = require('../siswaKelas/model');

        // 1. Find order
        const Product = require('../product/model');
        const order = await Order.findByPk(idOrder, {
            include: [{ model: Product, as: 'product', attributes: ['jenisProduk'] }]
        });
        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: 'Order tidak ditemukan.' });
        }

        if (order.statusPembayaran === 'Paid') {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Order sudah dibayar.' });
        }

// 2. Update Order with nominal if provided (for Seikhlasnya)
        const { nominal } = req.body;
        const updateData = {
            statusPembayaran: 'Paid',
            statusOrder: 'Completed',
            paidAt: new Date(),
            paymentMethod: 'Simulasi Dev',
            midtransTransactionId: `DUMMY-${Date.now()}`,
        };

        if (nominal !== undefined && nominal !== null) {
            updateData.hargaFinal = parseFloat(nominal);
            updateData.hargaTransaksi = parseFloat(nominal);
        }

        await order.update(updateData);

        // 3. Activate SiswaKelas linked to this order
        const [updatedCount] = await SiswaKelas.update(
            { statusEnrollment: 'Aktif', tanggalMasuk: new Date() },
            { where: { idOrderDaftarUlang: parseInt(idOrder) } }
        );

        // 4. Auto-unlock Materi if applicable
        if (order.product?.jenisProduk === 'Materi') {
            const AksesMateriService = require('../../../services/mysql/aksesMateri');
            const Siswa = require('../siswa/model');
            try {
                const targetSiswa = await Siswa.findOne({ where: { idUser: order.idUser } });
                if (targetSiswa) {
                    await AksesMateriService.grantAccess({
                        body: {
                            idSiswa: targetSiswa.idSiswa, 
                            idProduk: order.idProduk,
                            idOrder: order.idOrder
                        }
                    });
                    console.log(`🔓 Dummy Materi access granted for Siswa #${targetSiswa.idSiswa}`);
                }
            } catch (err) {
                console.error('Error auto-granting materi access in dummy payment:', err.message);
            }
        }

        res.status(StatusCodes.OK).json({
            success: true,
            message: order.product?.jenisProduk === 'Materi' 
                ? 'Pembayaran materi berhasil dikonfirmasi. Materi siap diakses!'
                : 'Pembayaran berhasil dikonfirmasi. Anda sekarang terdaftar aktif!',
            data: {
                idOrder: order.idOrder,
                statusPembayaran: 'Paid',
                statusEnrollment: 'Aktif',
                activatedCount: updatedCount,
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    initiatePayment,
    simulatePayment,
    handleWebhook,
    dummyConfirmEnrollment,
};
