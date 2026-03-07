const Flutterwave = require('flutterwave-node-v3');

class FlutterwaveService {
    constructor() {
        this.flw = new Flutterwave(
            process.env.FLW_PUBLIC_KEY,
            process.env.FLW_SECRET_KEY
        );
    }

    /**
     * Initiate Mobile Money Payment (M-Pesa Kenya)
     * @param {string} phoneNumber - User's phone number
     * @param {number} amount - Amount to charge
     * @param {string} txRef - Unique transaction reference
     * @param {string} email - User's email (required by Flutterwave)
     * @param {string} fullName - User's full name
     */
    async initiateMobileMoneyPayment(phoneNumber, amount, txRef, email, fullName) {
        try {
            const payload = {
                tx_ref: txRef,
                amount: amount,
                currency: 'KES',
                network: 'MPESA',
                email: email || 'customer@example.com',
                phone_number: this.formatPhoneNumber(phoneNumber),
                fullname: fullName || 'Insurance Customer',
                redirect_url: process.env.FLW_REDIRECT_URL || 'https://example.com'
            };

            const response = await this.flw.MobileMoney.mpesa(payload);

            return {
                success: response.status === 'success',
                message: response.message,
                data: response.data,
                flwRef: response.data ? response.data.flw_ref : null
            };
        } catch (error) {
            console.error('Flutterwave Mobile Money Error:', error);
            throw error;
        }
    }

    /**
     * Verify transaction status
     * @param {string} transactionId - Flutterwave transaction ID
     */
    async verifyTransaction(transactionId) {
        try {
            const response = await this.flw.Transaction.verify({ id: transactionId });
            return response.data;
        } catch (error) {
            console.error('Flutterwave Verification Error:', error);
            throw error;
        }
    }

    /**
     * Format phone number for Flutterwave (e.g., 07xxxxxxxx or 2547xxxxxxxx)
     */
    formatPhoneNumber(phone) {
        let formatted = phone.replace(/\D/g, '');
        if (formatted.startsWith('254')) {
            formatted = '0' + formatted.substring(3);
        }
        return formatted;
    }
}

module.exports = new FlutterwaveService();
