const axios = require('axios');

/**
 * Africa's Talking USSD Service
 * Handles integration with Africa's Talking USSD gateway
 */
class AfricasTalkingService {
  constructor() {
    this.baseURL = 'https://api.sandbox.africastalking.com/version1/ussd';
    this.username = process.env.AT_USERNAME || 'sandbox';
    this.apiKey = process.env.AT_API_KEY || '';
    this.shortCode = process.env.AT_SHORTCODE || '1212';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
  }

  /**
   * Initialize Africa's Talking client (for future use with AT SDK)
   */
  initialize() {
    if (!this.apiKey) {
      console.warn('Africa\'s Talking API key not configured. Set AT_API_KEY env var.');
      return false;
    }
    return true;
  }

  /**
   * Send USSD response back to Africa's Talking
   * @param {string} phoneNumber - User phone number
   * @param {string} response - USSD response text
   * @param {boolean} continueSession - Whether to keep session alive
   */
  async sendResponse(phoneNumber, response, continueSession = true) {
    try {
      const responseType = continueSession ? 'CON' : 'END';
      const formattedResponse = `${responseType} ${response}`;

      // In production, you would send this back via Africa's Talking API
      // For now, we return the formatted response for the controller to handle
      return {
        success: true,
        phoneNumber,
        response: formattedResponse,
        continueSession,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error sending USSD response:', error);
      throw error;
    }
  }

  /**
   * Handle incoming USSD request from Africa's Talking
   * Africa's Talking sends requests in this format:
   * {
   *   sessionId: "...",
   *   phoneNumber: "+254712345678",
   *   text: "1",
   *   networkOperator: "Safaricom"
   * }
   */
  async handleCallback(req) {
    try {
      const { sessionId, phoneNumber, text, networkOperator } = req.body || req;

      if (!sessionId || !phoneNumber) {
        throw new Error('Missing required fields: sessionId, phoneNumber');
      }

      return {
        sessionId,
        phoneNumber,
        text: text || '',
        networkOperator: networkOperator || 'Unknown',
        receivedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error handling Africa\'s Talking callback:', error);
      throw error;
    }
  }

  /**
   * Format response for Africa's Talking
   * @param {string} text - Response text
   * @param {boolean} continueSession - Whether session continues
   */
  formatATResponse(text, continueSession = true) {
    const prefix = continueSession ? 'CON' : 'END';
    return `${prefix} ${text}`;
  }

  /**
   * Parse USSD input (handles menu selection, text input, etc.)
   * @param {string} text - USSD input from user
   */
  parseInput(text) {
    if (!text) return { type: 'initial', value: null };

    const trimmed = text.trim();

    // Check if it's a menu selection (numeric)
    if (/^\d+$/.test(trimmed)) {
      return { type: 'menu', value: parseInt(trimmed) };
    }

    // Otherwise treat as text input
    return { type: 'input', value: trimmed };
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phoneNumber) {
    // Accept both +254... and 07... formats
    const pattern = /^(\+254|0)([7-9]\d{8})$/;
    return pattern.test(phoneNumber);
  }

  /**
   * Format phone number to standard +254 format
   */
  formatPhoneNumber(phoneNumber) {
    if (phoneNumber.startsWith('+254')) {
      return phoneNumber;
    }
    if (phoneNumber.startsWith('0')) {
      return '+254' + phoneNumber.substring(1);
    }
    return '+254' + phoneNumber;
  }

  /**
   * Get supported languages (for future multilingual support)
   */
  getSupportedLanguages() {
    return ['en', 'sw'];
  }

  /**
   * Build USSD menu response (CON or END)
   */
  buildMenuResponse(menuText, continueSession = true) {
    return this.formatATResponse(menuText, continueSession);
  }

  /**
   * Handle USSD session timeout (called when session expires)
   */
  handleSessionTimeout(sessionId, phoneNumber) {
    console.log(`USSD session ${sessionId} for ${phoneNumber} has timed out`);
    return {
      sessionId,
      phoneNumber,
      status: 'timeout',
      message: 'Your session has expired. Please dial again.'
    };
  }

  /**
   * Log USSD interaction for analytics
   */
  logInteraction(sessionId, phoneNumber, input, response, duration) {
    const log = {
      timestamp: new Date().toISOString(),
      sessionId,
      phoneNumber,
      input,
      response: response.substring(0, 100), // First 100 chars
      duration,
      status: 'success'
    };
    
    console.log('[USSD Analytics]', log);
    // In production, send to analytics service
    return log;
  }
}

module.exports = new AfricasTalkingService();
