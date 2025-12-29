const express = require('express');
const router = express.Router();
const { trackClick, getAnalytics, getProductAnalytics } = require('./controller');
const { authenticateUser, authorizeRoles } = require('../../../middlewares/authentication');

// Student routes - Track button click
router.post(
    '/student/materi/:idProduk/buttons/:idButton/click',
    authenticateUser,
    authorizeRoles('siswa'),
    trackClick
);

// Admin routes - Get analytics
router.get(
    '/cms/product/:idProduk/buttons/:idButton/analytics',
    authenticateUser,
    authorizeRoles('admin'),
    getAnalytics
);

router.get(
    '/cms/product/:idProduk/analytics',
    authenticateUser,
    authorizeRoles('admin'),
    getProductAnalytics
);

module.exports = router;
