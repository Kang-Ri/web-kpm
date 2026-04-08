const express = require('express');
const router = express.Router();
const { initiatePayment, simulatePayment, handleWebhook, dummyConfirmEnrollment } = require('./controller');
const { authenticatedUser } = require('../../../middlewares/auth');

// Initiate payment (get snap token)
router.post('/payment/initiate', initiatePayment);

// Simulate payment (for simulator mode)
router.post('/payment/simulate', simulatePayment);

// Webhook endpoint (for real Midtrans notifications)
router.post('/payment/webhook', handleWebhook);

// Dummy payment confirmation for enrollment (Dev Mode)
router.post('/payment/dummy-confirm/:idOrder', authenticatedUser, dummyConfirmEnrollment);

module.exports = router;

