const express = require('express');
const PaymentController = require('../controllers/PaymentController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

/**
 * Flutterwave Payment Routes
 */

// Initiate Flutterwave payment (Mobile Money / Card etc)
router.post('/initiate', AuthMiddleware.verify, ValidationMiddleware.validatePaymentRequest, AuthMiddleware.authorizeUser, PaymentController.initiateFlutterwavePayment);

// Flutterwave Webhook (Publicly accessible, but verified by signature)
router.post('/webhook', PaymentController.handleFlutterwaveWebhook);

// Check payment status manually
router.get('/status/:transactionId', AuthMiddleware.verify, AuthMiddleware.authorizeUser, PaymentController.checkPaymentStatus);

// Get payment history
router.get('/history/:userId', AuthMiddleware.verify, AuthMiddleware.authorizeUser, PaymentController.getPaymentHistory);

module.exports = router;
