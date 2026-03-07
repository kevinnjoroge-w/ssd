const FlutterwaveService = require('../services/FlutterwaveService');
const DataService = require('../services/DataService');
const { v4: uuidv4 } = require('uuid');

class PaymentController {
  /**
   * Initiate Flutterwave payment (Mobile Money / Card etc)
   */
  static async initiateFlutterwavePayment(req, res) {
    try {
      const { userId, policyId, amount, phoneNumber, email, fullName, description } = req.body;

      if (!userId || !amount || !phoneNumber) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      // Create payment record
      const transactionId = uuidv4();
      const payment = await DataService.createPayment(userId, policyId, amount, 'flutterwave', transactionId);

      // Initiate Mobile Money Charge
      const flwResult = await FlutterwaveService.initiateMobileMoneyPayment(
        phoneNumber,
        amount,
        transactionId,
        email,
        fullName
      );

      if (flwResult.success) {
        // Attach FLW reference for later verification
        if (flwResult.flwRef) {
          await DataService.attachFlwRef(transactionId, flwResult.flwRef);
        }

        return res.json({
          success: true,
          message: 'Payment initiation successful. Please check your phone for the STK push.',
          data: {
            transactionId: transactionId,
            flwRef: flwResult.flwRef,
            amount: amount
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: flwResult.message || 'Failed to initiate Flutterwave payment',
          data: flwResult.data
        });
      }
    } catch (error) {
      console.error('Flutterwave Initiation Error:', error);
      res.status(500).json({
        error: 'Failed to initiate payment',
        message: error.message
      });
    }
  }

  /**
   * Flutterwave Webhook Handler
   */
  static async handleFlutterwaveWebhook(req, res) {
    try {
      // 1. Verify webhook signature (if secret hash is provided)
      const secretHash = process.env.FLW_WEBHOOK_HASH;
      const signature = req.headers['verif-hash'];

      if (secretHash && signature !== secretHash) {
        console.warn('Invalid Flutterwave webhook signature');
        return res.status(401).end();
      }

      const payload = req.body;
      const { tx_ref, status, amount, id: flwTransactionId } = payload.data || payload;

      console.log(`[Flutterwave Webhook] Received status: ${status} for tx_ref: ${tx_ref}`);

      // 2. Map status
      let paymentStatus = 'pending';
      if (status === 'successful' || status === 'completed') {
        paymentStatus = 'completed';
      } else if (status === 'failed' || status === 'cancelled') {
        paymentStatus = 'failed';
      }

      // 3. Update payment record
      const payment = await DataService.updatePaymentStatus(tx_ref, paymentStatus, {
        flwRef: flwTransactionId,
        mpesaPhone: payload.data?.customer?.phone_number
      });

      if (paymentStatus === 'completed' && payment) {
        console.log(`[Payment success] User: ${payment.user_id}, Policy: ${payment.policy_id}`);
        // TODO: SMS Notification
      }

      res.status(200).end();
    } catch (error) {
      console.error('Flutterwave Webhook Error:', error);
      res.status(500).end();
    }
  }

  /**
   * Check payment status (Manual trigger)
   */
  static async checkPaymentStatus(req, res) {
    try {
      const { transactionId } = req.params;

      // In Flutterwave, we usually verify by transaction ID (numeric) or by local ID if we search
      const payment = await DataService.getPaymentByTransactionId(transactionId);

      if (!payment || !payment.flw_ref) {
        return res.status(404).json({ error: 'Payment not found or missing Flutterwave reference' });
      }

      const verification = await FlutterwaveService.verifyTransaction(payment.flw_ref);

      if (verification && verification.status === 'successful') {
        await DataService.updatePaymentStatus(transactionId, 'completed', {
          flwRef: verification.id.toString()
        });
      }

      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      console.error('Check Payment Status Error:', error);
      res.status(500).json({
        error: 'Failed to verify payment status',
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

      res.json({ success: true, data: payments });
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
