const express = require('express');
const router = express.Router();
const {
    create,
    index,
    find,
    update,
    cancel,
    confirmPayment,
    destroy,
    updatePaymentStatus,
} = require('./controller');

// Middleware auth (sesuaikan dengan middleware yang ada)
// const { authenticateUser, authorizeRoles } = require('../../../middlewares/auth');

// --- Public/User Routes ---
// POST /api/v1/orders - Membuat order baru
router.post('/', create);

// GET /api/v1/orders - Mengambil semua order (bisa difilter dengan query params)
// Untuk user: hanya order miliknya, untuk admin: semua order
router.get('/', index);

// GET /api/v1/orders/:id - Mengambil detail order
router.get('/:id', find);

// PATCH /api/v1/orders/:id - Update status order
router.patch('/:id', update);

// POST /api/v1/orders/:id/cancel - Membatalkan order (user hanya bisa cancel order miliknya)
router.post('/:id/cancel', cancel);

// POST /api/v1/cms/orders/:id/confirm-payment - Konfirmasi pembayaran & aktifkan enrollment (Admin only)
router.post('/:id/confirm-payment', confirmPayment);

// PATCH /api/v1/orders/:id/payment-status - Update payment status (Admin only)
router.patch('/:id/payment-status', updatePaymentStatus);

// --- Admin Routes ---
// DELETE /api/v1/orders/:id - Menghapus order (hanya admin)
// router.delete('/:id', authenticateUser, authorizeRoles('Super Admin', 'Admin'), destroy);
router.delete('/:id', destroy);

module.exports = router;
