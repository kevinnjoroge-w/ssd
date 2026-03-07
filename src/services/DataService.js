const User = require('../models/User');
const Plan = require('../models/Plan');
const Policy = require('../models/Policy');
const Payment = require('../models/Payment');
const Session = require('../models/Session');
const { v4: uuidv4 } = require('uuid');

class DataService {
  /**
   * Get or create user by phone
   */
  static async getOrCreateUser(phone, name = null) {
    try {
      let user = await User.query().findOne({ phone });

      if (!user && name) {
        user = await User.query().insert({
          id: uuidv4(),
          phone,
          name
        });
      }

      return user;
    } catch (error) {
      console.error('User lookup error:', error);
      throw error;
    }
  }

  /**
   * Get user by ID with relations
   */
  static async getUserById(id) {
    try {
      return await User.query()
        .findById(id)
        .withGraphFetched('[policies.plan, payments]');
    } catch (error) {
      console.error('User by ID lookup error:', error);
      throw error;
    }
  }

  /**
   * Get session
   */
  static async getSession(sessionId) {
    try {
      return await Session.query()
        .findOne({ session_id: sessionId })
        .withGraphFetched('user');
    } catch (error) {
      console.error('Session lookup error:', error);
      throw error;
    }
  }

  /**
   * Create or update session
   */
  static async upsertSession(sessionId, phone, updates = {}) {
    try {
      console.log('[DataService] upsertSession called for', sessionId, 'with updates:', updates);
      let session = await Session.query().findOne({ session_id: sessionId });

      if (session) {
        // Use a two-step approach to support sqlite which doesn't support RETURNING
        await Session.query()
          .patch({
            ...updates,
            updated_at: new Date().toISOString()
          })
          .where('session_id', sessionId);

        return await Session.query().findOne({ session_id: sessionId });
      } else {
        const insertData = {
          id: uuidv4(),
          session_id: sessionId,
          phone,
          ...updates,
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 mins expiry
        };

        return await Session.query().insert(insertData);
      }
    } catch (error) {
      console.error('Session upsert error:', error);
      throw error;
    }
  }

  /**
   * Get all plans
   */
  static async getPlans() {
    try {
      return await Plan.query().where('active', true);
    } catch (error) {
      console.error('Plans lookup error:', error);
      throw error;
    }
  }

  /**
   * Get plan by coverage type
   */
  static async getPlanByCoverageType(coverageType) {
    try {
      return await Plan.query()
        .where('coverage_type', coverageType)
        .where('active', true)
        .first();
    } catch (error) {
      console.error('Plan lookup error:', error);
      throw error;
    }
  }

  /**
   * Create policy
   */
  static async createPolicy(userId, planId, premium, coverageAmount) {
    try {
      const policyNumber = `POL-${Date.now()}-${uuidv4().substring(0, 8)}`;

      return await Policy.query().insert({
        id: uuidv4(),
        user_id: userId,
        plan_id: planId,
        policy_number: policyNumber,
        premium,
        coverage_amount: coverageAmount,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
        auto_renew: true
      });
    } catch (error) {
      console.error('Policy creation error:', error);
      throw error;
    }
  }

  /**
   * Get user's active policies
   */
  static async getUserActivePolicies(userId) {
    try {
      return await Policy.query()
        .where('user_id', userId)
        .where('status', 'active')
        .withGraphFetched('plan');
    } catch (error) {
      console.error('Policies lookup error:', error);
      throw error;
    }
  }

  /**
   * Create payment record
   */
  static async createPayment(userId, policyId, amount, paymentMethod, transactionId) {
    try {
      return await Payment.query().insert({
        id: uuidv4(),
        user_id: userId,
        policy_id: policyId,
        amount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'pending',
        currency: 'KES',
        period: 'monthly',
        due_date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Payment creation error:', error);
      throw error;
    }
  }

  /**
   * Update payment status (Enhanced for Flutterwave & M-Pesa)
   */
  static async updatePaymentStatus(transactionId, status, metadata = {}) {
    try {
      const patchData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        patchData.paid_date = new Date().toISOString();
      }

      // Merge additional metadata (receipts, refs, etc)
      if (metadata.mpesaReceipt) patchData.mpesa_receipt = metadata.mpesaReceipt;
      if (metadata.mpesaPhone) patchData.mpesa_phone = metadata.mpesaPhone;
      if (metadata.flwRef) patchData.flw_ref = metadata.flwRef;

      await Payment.query().patch(patchData).where(builder => {
        builder.where('transaction_id', transactionId)
          .orWhere('merchant_request_id', transactionId)
          .orWhere('checkout_request_id', transactionId)
          .orWhere('flw_ref', transactionId);
      });

      return await Payment.query().where(builder => {
        builder.where('transaction_id', transactionId)
          .orWhere('merchant_request_id', transactionId)
          .orWhere('checkout_request_id', transactionId)
          .orWhere('flw_ref', transactionId);
      }).first();
    } catch (error) {
      console.error('Payment update error:', error);
      throw error;
    }
  }

  /**
   * Attach Flutterwave reference
   */
  static async attachFlwRef(transactionId, flwRef) {
    try {
      await Payment.query()
        .patch({ flw_ref: flwRef, updated_at: new Date().toISOString() })
        .where('transaction_id', transactionId);

      return await Payment.query().findOne({ transaction_id: transactionId });
    } catch (error) {
      console.error('Attach FLW Ref error:', error);
      throw error;
    }
  }

  /**
   * Get payment by transaction ID
   */
  static async getPaymentByTransactionId(transactionId) {
    try {
      return await Payment.query().where('transaction_id', transactionId).first();
    } catch (error) {
      console.error('Get payment error:', error);
      throw error;
    }
  }

  /**
   * Get payment by Flutterwave reference
   */
  static async getPaymentByFlwRef(flwRef) {
    try {
      return await Payment.query().where('flw_ref', flwRef).first();
    } catch (error) {
      console.error('Get payment by flw_ref error:', error);
      throw error;
    }
  }

  /**
   * Get user payment history
   */
  static async getUserPaymentHistory(userId, limit = 10) {
    try {
      return await Payment.query()
        .where('user_id', userId)
        .orderBy('created_at', 'desc')
        .limit(limit);
    } catch (error) {
      console.error('Payment history lookup error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  static async updateUserProfile(userId, updates) {
    try {
      await User.query().patch(updates).where('id', userId);
      return await User.query().findOne({ id: userId });
    } catch (error) {
      console.error('User update error:', error);
      throw error;
    }
  }
}

module.exports = DataService;
