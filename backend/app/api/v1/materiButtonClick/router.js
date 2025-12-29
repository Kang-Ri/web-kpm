const express = require('express');
const router = express.Router();
const { trackClick, getAnalytics, getProductAnalytics } = require('./controller');
const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// Student routes - Track button click
router.post(
    '/student/materi/:idProduk/buttons/:idButton/click',
    authenticatedUser,
    authorizeRoles('siswa'),
    trackClick
);

// Admin routes - Get analytics
router.get(
    '/cms/product/:idProduk/buttons/:idButton/analytics',
    authenticatedUser,
    authorizeRoles('admin'),
    getAnalytics
);

router.get(
    '/cms/product/:idProduk/analytics',
    authenticatedUser,
    authorizeRoles('admin'),
    getProductAnalytics
);

module.exports = router;
