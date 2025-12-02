const USSDService = require('../services/USSDService');
const DataService = require('../services/DataService');
const MpesaService = require('../services/MpesaService');

class USSDController {
  /**
   * Handle incoming USSD request
   */
  static async handleUSSD(req, res) {
    try {
      const { sessionId, phoneNumber, text } = req.body;

      if (!sessionId || !phoneNumber) {
        return res.status(400).json({
          error: 'Missing required fields: sessionId, phoneNumber'
        });
      }

      // Get or create session
      let session = await DataService.getSession(sessionId);
      
      if (!session) {
        // New session
        session = await DataService.upsertSession(sessionId, phoneNumber, {
          status: 'active',
          current_menu: 'main',
          session_data: {}
        });
      }

      // Get user if exists
      let user = null;
      if (session.user_id) {
        user = await DataService.getOrCreateUser(phoneNumber);
      }

      // Process USSD menu
      const ussdResponse = USSDService.processUSSD(sessionId, phoneNumber, text, user);

      // Format response
      const response = USSDService.formatResponse(ussdResponse.response);

      // Update session
      const sessionData = {
        current_menu: ussdResponse.nextMenu,
        user_input: text,
        updated_at: new Date().toISOString()
      };

      if (!ussdResponse.continueSession) {
        sessionData.status = 'ended';
      }

      await DataService.upsertSession(sessionId, phoneNumber, sessionData);

      // Send USSD response
      res.json({
        response: response,
        continueSession: ussdResponse.continueSession,
        triggerMpesa: ussdResponse.trigger_mpesa || false
      });
    } catch (error) {
      console.error('USSD Handler Error:', error);
      res.status(500).json({
        error: 'Failed to process USSD request',
        message: error.message
      });
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
