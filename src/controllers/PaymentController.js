const MpesaService = require('../services/MpesaService');
const DataService = require('../services/DataService');
const { v4: uuidv4 } = require('uuid');

class PaymentController {
  /**
   * Initiate M-Pesa payment
   */
  static async initiateMpesaPayment(req, res) {
    try {
      const { userId, policyId, amount, phoneNumber, description } = req.body;

      if (!userId || !amount || !phoneNumber) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      // Create payment record
      const transactionId = uuidv4();
      await DataService.createPayment(userId, policyId, amount, 'mpesa', transactionId);

      // Initiate STK Push
      const stkResult = await MpesaService.initiateStkPush(
        phoneNumber,
        amount,
        `INS-${transactionId}`,
        description || 'Insurance Premium Payment'
      );

      res.json({
        success: stkResult.success,
        message: stkResult.success ? 'STK push sent successfully' : 'Failed to send STK push',
        data: {
          checkoutRequestId: stkResult.checkoutRequestId,
          transactionId: transactionId,
          amount: amount,
          phoneNumber: phoneNumber
        }
      });
    } catch (error) {
      console.error('M-Pesa Payment Initiation Error:', error);
      res.status(500).json({
        error: 'Failed to initiate payment',
        message: error.message
      });
    }
  }

  /**
   * M-Pesa Callback Handler
   */
  static async handleMpesaCallback(req, res) {
    try {
      // Acknowledge receipt immediately
      res.json({});

      // Validate callback
      if (!MpesaService.validateCallback(req.body)) {
        console.error('Invalid M-Pesa callback');
        return;
      }

      // Process callback
      const paymentResult = MpesaService.processCallback(req.body);

      // Update payment based on result
      const status = paymentResult.resultCode === 0 ? 'completed' : 'failed';
      
      const payment = await DataService.updatePaymentStatus(
        paymentResult.merchantRequestId,
        status,
        paymentResult.mpesaReceiptNumber,
        paymentResult.phoneNumber
      );

      if (status === 'completed' && payment) {
        // TODO: Send confirmation SMS
        console.log('Payment successful:', payment);
      }
    } catch (error) {
      console.error('M-Pesa Callback Error:', error);
    }
  }

  /**
   * Check payment status
   */
  static async checkPaymentStatus(req, res) {
    try {
      const { checkoutRequestId } = req.params;

      const status = await MpesaService.checkStkPushStatus(checkoutRequestId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Check Payment Status Error:', error);
      res.status(500).json({
        error: 'Failed to check payment status',
        message: error.message
      });
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(req, res) {
    try {
      const { userId } = req.params;
      const limit = req.query.limit || 10;

      const payments = await DataService.getUserPaymentHistory(userId, limit);

      res.json({
        success: true,
        data: payments
      });
    } catch (error) {
      console.error('Get Payment History Error:', error);
      res.status(500).json({
        error: 'Failed to fetch payment history',
        message: error.message
      });
    }
  }
}

module.exports = PaymentController;
