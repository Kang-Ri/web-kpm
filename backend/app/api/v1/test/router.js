const express = require('express');
const router = express.Router();
const { createDummyOrder, cleanupDummyOrders } = require('./controller');

// Create dummy order for payment testing
router.post('/create-dummy-order', createDummyOrder);

// Cleanup test orders
router.delete('/cleanup-dummy-orders', cleanupDummyOrders);

module.exports = router;
