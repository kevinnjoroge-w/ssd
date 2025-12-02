/**
 * Helper utilities
 */

class Helpers {
  /**
   * Format phone number to E.164 standard
   */
  static formatPhoneNumber(phone) {
    let formatted = phone.replace(/\D/g, '');
    
    if (formatted.startsWith('0')) {
      formatted = '254' + formatted.substring(1);
    } else if (!formatted.startsWith('254')) {
      formatted = '254' + formatted;
    }
    
    return '+' + formatted;
  }

  /**
   * Validate Kenyan phone number
   */
  static isValidKenyanPhone(phone) {
    const pattern = /^(\+254|0)[0-9]{9}$/;
    return pattern.test(phone);
  }

  /**
   * Generate unique policy number
   */
  static generatePolicyNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    return `POL-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Generate transaction reference
   */
  static generateTransactionRef() {
    return `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`.toUpperCase();
  }

  /**
   * Format currency
   */
  static formatCurrency(amount, currency = 'KES') {
    const formatter = new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency
    });
    return formatter.format(amount);
  }

  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth) {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Check if date is in the past
   */
  static isPastDate(date) {
    return new Date(date) < new Date();
  }

  /**
   * Add days to date
   */
  static addDaysToDate(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  /**
   * Format date to DD/MM/YYYY
   */
  static formatDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  /**
   * Parse payment period to days
   */
  static getPeriodInDays(period) {
    const periods = {
      'monthly': 30,
      'quarterly': 90,
      'yearly': 365
    };
    return periods[period] || 30;
  }

  /**
   * Chunk array into smaller arrays
   */
  static chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Sleep/delay
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic
   */
  static async retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 1) {
        throw error;
      }
      await this.sleep(delay);
      return this.retry(fn, retries - 1, delay);
    }
  }

  /**
   * Safe JSON parse
   */
  static safeJsonParse(str, fallback = null) {
    try {
      return JSON.parse(str);
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Deep clone object
   */
  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Check if value is empty
   */
  static isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  }
}

module.exports = Helpers;
