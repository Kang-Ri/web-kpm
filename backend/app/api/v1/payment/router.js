const express = require('express');
const router = express.Router();
const { initiatePayment, simulatePayment, handleWebhook } = require('./controller');

// Initiate payment (get snap token)
router.post('/initiate', initiatePayment);

// Simulate payment (for simulator mode)
router.post('/simulate', simulatePayment);

// Webhook endpoint (for real Midtrans notifications)
router.post('/webhook', handleWebhook);

module.exports = router;
