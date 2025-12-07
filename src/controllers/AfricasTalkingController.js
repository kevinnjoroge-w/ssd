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
          session_data: {}
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

      // Process USSD menu
      const ussdResponse = USSDService.processUSSD(
        sessionId,
        formattedPhone,
        text,
        user
      );

      // Update session with current state
      const sessionData = {
        current_menu: ussdResponse.nextMenu,
        user_input: text,
        operator: callbackData.networkOperator,
        updated_at: new Date().toISOString()
      };

      if (!ussdResponse.continueSession) {
        sessionData.status = 'ended';
      }

      await DataService.upsertSession(sessionId, formattedPhone, sessionData);

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

      // Send error response
      const errorResponse = AfricasTalkingService.formatATResponse(
        'An error occurred. Please try again later or dial *123# to restart.',
        false
      );

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
