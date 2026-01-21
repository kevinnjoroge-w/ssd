const AfricasTalkingService = require('../services/AfricasTalkingService');
const USSDService = require('../services/USSDService');
const DataService = require('../services/DataService');
const Helpers = require('../utils/helpers');

/**
 * Africa's Talking USSD Controller
 * Handles incoming USSD requests from Africa's Talking gateway
 */
class AfricasTalkingController {
  /**
   * Handle incoming USSD callback from Africa's Talking
   * Africa's Talking sends POST requests to this endpoint with:
   * - sessionId: Unique identifier for the USSD session
   * - phoneNumber: User's phone number
   * - text: User's input (empty for initial, menu selection/text input for subsequent)
   * - networkOperator: The mobile operator (Safaricom, Airtel, Idea, etc.)
   */
  static async handleATCallback(req, res) {
    const startTime = Date.now();
    let sessionId, phoneNumber, text;

    try {
      // Parse AT callback
      const callbackData = await AfricasTalkingService.handleCallback(req);
      
      sessionId = callbackData.sessionId;
      phoneNumber = callbackData.phoneNumber;
      text = callbackData.text;

      console.log(`[Africa's Talking] USSD Request - Phone: ${phoneNumber}, SessionId: ${sessionId}, Text: "${text}"`);

      // Validate phone number
      if (!AfricasTalkingService.validatePhoneNumber(phoneNumber)) {
        const response = AfricasTalkingService.formatATResponse('Invalid phone number format', false);
        return res.send(response);
      }

      // Format phone number to standard format
      const formattedPhone = AfricasTalkingService.formatPhoneNumber(phoneNumber);

      // Get or create session
      let session = await DataService.getSession(sessionId);
      let isNewSession = false;

      if (!session) {
        // New USSD session
        isNewSession = true;
        session = await DataService.upsertSession(sessionId, formattedPhone, {
          status: 'active',
          current_menu: 'main',
          session_data: {},
          operator: callbackData.networkOperator || 'Unknown'
        });
      }

      // Get user if exists
      let user = null;
      try {
        user = await DataService.getOrCreateUser(formattedPhone);
      } catch (e) {
        console.log(`New user from ${formattedPhone}`);
      }

      // Parse user input
      const parsedInput = AfricasTalkingService.parseInput(text);

      // Process USSD menu (pass current session state)
      const ussdResponse = await USSDService.processUSSD(
        sessionId,
        formattedPhone,
        text,
        user,
        session.current_menu,
        session.session_data || {}
      );

      // Update session with current state
      let sessionData = {
        current_menu: ussdResponse.nextMenu,
        user_input: text,
        operator: callbackData.networkOperator,
        updated_at: new Date().toISOString()
      };

      // Merge any session_data updates returned by the USSD flow
      if (ussdResponse.updates) {
        if (ussdResponse.updates.session_data) {
          sessionData.session_data = Object.assign({}, session.session_data || {}, ussdResponse.updates.session_data);
        }
        // copy other update keys if present
        Object.keys(ussdResponse.updates).forEach((k) => {
          if (k === 'session_data') return;
          sessionData[k] = ussdResponse.updates[k];
        });
      }

      // sessionData logged during development; removed verbose logging

      if (!ussdResponse.continueSession) {
        sessionData.status = 'ended';
      }

      // Persist session and retrieve latest
      session = await DataService.upsertSession(sessionId, formattedPhone, sessionData);

      // Handle post-menu actions (create or update user)
      if (ussdResponse.action === 'create_user') {
        try {
          const sd = session.session_data || {};
          const created = await DataService.getOrCreateUser(formattedPhone, sd.name || null);
          if (created && (sd.occupation || sd.income_range || sd.name)) {
            await DataService.updateUserProfile(created.id, {
              name: sd.name,
              occupation: sd.occupation,
              income_range: sd.income_range
            });
          }
          user = created;
        } catch (e) {
          console.error('Session action create_user error:', e);
        }
      } else if (ussdResponse.action === 'update_user') {
        try {
          const sd = session.session_data || {};
          if (user) {
            await DataService.updateUserProfile(user.id, {
              name: sd.name,
              occupation: sd.occupation,
              income_range: sd.income_range
            });
          } else {
            const created = await DataService.getOrCreateUser(formattedPhone, sd.name || null);
            if (created) {
              await DataService.updateUserProfile(created.id, {
                name: sd.name,
                occupation: sd.occupation,
                income_range: sd.income_range
              });
              user = created;
            }
          }
        } catch (e) {
          console.error('Session action update_user error:', e);
        }
      }

      // Format and send response
      const atResponse = AfricasTalkingService.formatATResponse(
        ussdResponse.response,
        ussdResponse.continueSession
      );

      // Log interaction
      const duration = Date.now() - startTime;
      AfricasTalkingService.logInteraction(
        sessionId,
        formattedPhone,
        text,
        ussdResponse.response,
        duration
      );

      console.log(`[Africa's Talking] Response sent - Duration: ${duration}ms, ContinueSession: ${ussdResponse.continueSession}`);

      // Send response back to Africa's Talking
      res.set('Content-Type', 'text/plain');
      res.send(atResponse);

    } catch (error) {
      console.error('[Africa\'s Talking Error]', error);

      // Try to persist an error state for this session so it can be resumed
      try {
        if (sessionId && phoneNumber) {
          const formattedPhoneErr = AfricasTalkingService.formatPhoneNumber(phoneNumber);
          await DataService.upsertSession(sessionId, formattedPhoneErr, {
            current_menu: 'error',
            status: 'error',
            updated_at: new Date().toISOString()
          });
        }
      } catch (persistErr) {
        console.error('Failed to persist session error state:', persistErr);
      }

      // Return a friendly retry prompt (keep session open so user can choose)
        const friendlyMessage = "Sorry, we couldn't complete your request right now.\n1. Try again\n2. Exit";
      const errorResponse = AfricasTalkingService.formatATResponse(friendlyMessage, true);

      res.set('Content-Type', 'text/plain');
      res.send(errorResponse);
    }
  }

  /**
   * Test endpoint to simulate AT USSD request (for development)
   */
  static async simulateUSSDRequest(req, res) {
    try {
      const { phoneNumber, text = '' } = req.body;

      if (!phoneNumber) {
        return res.status(400).json({ error: 'phoneNumber is required' });
      }

      // Create mock AT callback
      const mockRequest = {
        body: {
          sessionId: Helpers.generateSessionId(),
          phoneNumber: phoneNumber,
          text: text,
          networkOperator: 'Safaricom'
        }
      };

      // Handle as AT callback
      let responseText = '';
      const mockRes = {
        set: (header, value) => {},
        send: (text) => {
          responseText = text;
        }
      };

      await this.handleATCallback(mockRequest, mockRes);

      res.json({
        success: true,
        response: responseText,
        message: 'USSD request simulated successfully'
      });

    } catch (error) {
      console.error('Error simulating USSD:', error);
      res.status(500).json({
        error: 'Failed to simulate USSD request',
        message: error.message
      });
    }
  }

  /**
   * Get USSD session details (for debugging/analytics)
   */
  static async getSessionDetails(req, res) {
    try {
      const { sessionId } = req.params;

      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId is required' });
      }

      const session = await DataService.getSession(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Session not found' });
      }

      res.json({
        success: true,
        data: session
      });

    } catch (error) {
      console.error('Error getting session:', error);
      res.status(500).json({
        error: 'Failed to get session details',
        message: error.message
      });
    }
  }
}

module.exports = AfricasTalkingController;
