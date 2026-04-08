const express = require('express');
const router = express.Router();
const { initiatePayment, simulatePayment, handleWebhook, dummyConfirmEnrollment } = require('./controller');
const { authenticatedUser } = require('../../../middlewares/auth');

// Initiate payment (get snap token)
router.post('/initiate', initiatePayment);

// Simulate payment (for simulator mode)
router.post('/simulate', simulatePayment);

// Webhook endpoint (for real Midtrans notifications)
router.post('/webhook', handleWebhook);

// Dummy payment confirmation for enrollment (Dev Mode)
router.post('/dummy-confirm/:idOrder', authenticatedUser, dummyConfirmEnrollment);

module.exports = router;

