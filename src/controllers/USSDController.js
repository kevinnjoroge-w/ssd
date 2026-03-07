const USSDService = require('../services/USSDService');
const DataService = require('../services/DataService');
const MpesaService = require('../services/MpesaService');

// In-memory storage (used for simplified USSD flow per user's request)
const users = {};
const policies = {};
const claims = {};
const sessions = {};

class USSDController {
  /**
   * Handle incoming USSD request
   */
  static async handleUSSD(req, res) {
    try {
      const { sessionId, phoneNumber, text = '' } = req.body;

      if (!sessionId || !phoneNumber) {
        return res.status(400).json({ error: 'Missing required fields: sessionId, phoneNumber' });
      }

      const result = await USSDService.processUSSD(sessionId, phoneNumber, text);

      // Save session updates if any
      if (result.updates) {
        await DataService.upsertSession(sessionId, phoneNumber, {
          current_menu: result.nextMenu,
          session_data: result.updates.session_data || {}
        });
      }

      res.set('Content-Type', 'text/plain');
      res.send(result.response);
    } catch (error) {
      console.error('USSD Handler Error:', error);
      res.status(500).json({ error: 'Failed to process USSD request', message: error.message });
    }
  }

  /**
   * Register new user (USSD flow)
   */
  static async registerUser(req, res) {
    try {
      const { sessionId, phoneNumber, name, occupation, incomeRange } = req.body;

      const user = await DataService.getOrCreateUser(phoneNumber, name);

      if (occupation || incomeRange) {
        await DataService.updateUserProfile(user.id, {
          occupation: occupation || null,
          income_range: incomeRange || null
        });
      }

      // Update session with user
      await DataService.upsertSession(sessionId, phoneNumber, {
        user_id: user.id
      });

      res.json({
        success: true,
        message: 'User registered successfully',
        userId: user.id
      });
    } catch (error) {
      console.error('User Registration Error:', error);
      res.status(500).json({
        error: 'Failed to register user',
        message: error.message
      });
    }
  }

  /**
   * Get plans
   */
  static async getPlans(req, res) {
    try {
      const plans = await DataService.getPlans();
      res.json({
        success: true,
        data: plans
      });
    } catch (error) {
      console.error('Get Plans Error:', error);
      res.status(500).json({
        error: 'Failed to fetch plans',
        message: error.message
      });
    }
  }

  /**
   * Buy insurance policy
   */
  static async buyPolicy(req, res) {
    try {
      const { userId, planId, premium } = req.body;

      if (!userId || !planId || !premium) {
        return res.status(400).json({
          error: 'Missing required fields: userId, planId, premium'
        });
      }

      // Validate premium range
      const plan = await Plan.query().findById(planId);
      if (!plan) {
        return res.status(404).json({ error: 'Plan not found' });
      }

      if (premium < plan.min_premium || premium > plan.max_premium) {
        return res.status(400).json({
          error: `Premium must be between ${plan.min_premium} and ${plan.max_premium}`
        });
      }

      // Calculate coverage
      const coverage = USSDService.calculateRecommendedCoverage(premium, plan.coverage_multiplier);

      // Create policy
      const policy = await DataService.createPolicy(userId, planId, premium, coverage);

      res.json({
        success: true,
        message: 'Policy created successfully',
        data: {
          policyNumber: policy.policy_number,
          premium: policy.premium,
          coverage: policy.coverage_amount,
          status: policy.status
        }
      });
    } catch (error) {
      console.error('Buy Policy Error:', error);
      res.status(500).json({
        error: 'Failed to create policy',
        message: error.message
      });
    }
  }

  /**
   * Get user's active policies
   */
  static async getUserPolicies(req, res) {
    try {
      const { userId } = req.params;

      const policies = await DataService.getUserActivePolicies(userId);

      res.json({
        success: true,
        data: policies
      });
    } catch (error) {
      console.error('Get User Policies Error:', error);
      res.status(500).json({
        error: 'Failed to fetch policies',
        message: error.message
      });
    }
  }
}

module.exports = USSDController;
