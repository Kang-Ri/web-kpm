const express = require('express');
const router = express.Router();
const { trackClick, getButtonClicks, getProductAnalytics, exportClicks } = require('./controller');
const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// Student routes - Track button click
router.post(
    '/student/materi/:idProduk/buttons/:idButton/click',
    authenticatedUser,
    authorizeRoles('Siswa'),
    trackClick
);

// Legacy/Complex route
router.get(
    '/cms/product/:idProduk/buttons/:idButton/analytics',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    getButtonClicks
);

// New cleaner route for modal
router.get(
    '/cms/buttons/:idButton/clicks',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    getButtonClicks
);

router.get(
    '/cms/product/:idProduk/analytics',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    getProductAnalytics
);

router.get(
    '/cms/materi/clicks/export',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    exportClicks
);

module.exports = router;
