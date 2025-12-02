const express = require('express');
const PaymentController = require('../controllers/PaymentController');

const router = express.Router();

// Initiate M-Pesa payment
router.post('/mpesa/initiate', PaymentController.initiateMpesaPayment);

// M-Pesa callback
router.post('/mpesa/callback', PaymentController.handleMpesaCallback);

// Check payment status
router.get('/mpesa/status/:checkoutRequestId', PaymentController.checkPaymentStatus);

// Get payment history
router.get('/history/:userId', PaymentController.getPaymentHistory);

module.exports = router;
