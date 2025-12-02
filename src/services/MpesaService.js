const axios = require('axios');

class MpesaService {
  /**
   * Generate M-Pesa access token
   */
  static async getAccessToken() {
    try {
      const auth = Buffer.from(
        `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
      ).toString('base64');

      const response = await axios.get(
        'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error('M-Pesa Token Error:', error);
      throw new Error('Failed to generate M-Pesa access token');
    }
  }

  /**
   * Initiate STK Push (Lipa Na M-Pesa Online)
   */
  static async initiateStkPush(phoneNumber, amount, accountReference, description) {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      
      const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      const payload = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.ceil(amount),
        PartyA: this.formatPhoneNumber(phoneNumber),
        PartyB: process.env.MPESA_SHORTCODE,
        PhoneNumber: this.formatPhoneNumber(phoneNumber),
        CallBackURL: process.env.MPESA_CALLBACK_URL,
        AccountReference: accountReference,
        TransactionDesc: description
      };

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: response.data.ResponseCode === '0',
        data: response.data,
        checkoutRequestId: response.data.CheckoutRequestId
      };
    } catch (error) {
      console.error('M-Pesa STK Push Error:', error);
      throw error;
    }
  }

  /**
   * Check STK Push request status
   */
  static async checkStkPushStatus(checkoutRequestId) {
    try {
      const token = await this.getAccessToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      
      const password = Buffer.from(
        `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
      ).toString('base64');

      const payload = {
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await axios.post(
        'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error('M-Pesa Status Check Error:', error);
      throw error;
    }
  }

  /**
   * Format phone number to M-Pesa format (254xxxxxxxxx)
   */
  static formatPhoneNumber(phone) {
    let formatted = phone.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }
    return formatted;
  }

  /**
   * Validate M-Pesa callback response
   */
  static validateCallback(callbackData) {
    const requiredFields = ['Body'];
    return requiredFields.every(field => field in callbackData);
  }

  /**
   * Process payment callback from M-Pesa
   */
  static processCallback(callbackData) {
    try {
      const stkCallback = callbackData.Body.stkCallback;
      
      const result = {
        merchantRequestId: stkCallback.MerchantRequestID,
        checkoutRequestId: stkCallback.CheckoutRequestID,
        resultCode: stkCallback.ResultCode,
        resultDesc: stkCallback.ResultDesc
      };

      if (stkCallback.ResultCode === 0) {
        // Payment successful
        const callbackMetadata = stkCallback.CallbackMetadata.Item;
        result.amount = callbackMetadata.find(item => item.Name === 'Amount')?.Value;
        result.mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
        result.transactionDate = callbackMetadata.find(item => item.Name === 'TransactionDate')?.Value;
        result.phoneNumber = callbackMetadata.find(item => item.Name === 'PhoneNumber')?.Value;
      }

      return result;
    } catch (error) {
      console.error('M-Pesa Callback Processing Error:', error);
      throw error;
    }
  }
}

module.exports = MpesaService;
