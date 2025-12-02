// Application Constants
module.exports = {
  // Insurance Plans
  PLANS: {
    BASIC: 'basic',
    STANDARD: 'standard',
    COMPREHENSIVE: 'comprehensive'
  },

  // Premium Ranges (KES)
  PREMIUM_RANGES: {
    BASIC: { min: 50, max: 100 },
    STANDARD: { min: 100, max: 300 },
    COMPREHENSIVE: { min: 300, max: 500 }
  },

  // Coverage Multiplier
  COVERAGE_MULTIPLIER: 500,

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed'
  },

  // Payment Methods
  PAYMENT_METHODS: {
    MPESA: 'mpesa',
    BANK_TRANSFER: 'bank_transfer'
  },

  // Policy Status
  POLICY_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    EXPIRED: 'expired',
    CLAIMED: 'claimed'
  },

  // Session Status
  SESSION_STATUS: {
    ACTIVE: 'active',
    ENDED: 'ended'
  },

  // Languages
  LANGUAGES: {
    ENGLISH: 'en',
    SWAHILI: 'sw'
  },

  // Income Ranges
  INCOME_RANGES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },

  // USSD Menu States
  MENU_STATES: {
    MAIN: 'main',
    REGISTER: 'register_name',
    REGISTER_OCCUPATION: 'register_occupation',
    REGISTER_INCOME: 'register_income',
    BUY_INSURANCE: 'buy_insurance',
    SELECT_PLAN: 'select_plan',
    ENTER_PREMIUM: 'enter_premium',
    CONFIRM_PURCHASE: 'confirm_purchase',
    PAY_PREMIUM: 'pay_premium',
    CHECK_BALANCE: 'check_balance',
    MY_PLANS: 'my_plans',
    END: 'end',
    ERROR: 'error'
  },

  // USSD Response Types
  USSD_RESPONSE: {
    CON: 'CON',      // Continue session
    END: 'END'       // End session
  },

  // Max characters per USSD line
  USSD_MAX_CHARS: 160,

  // Session expiry time (30 minutes)
  SESSION_EXPIRY_MS: 30 * 60 * 1000,

  // Risk Profiles
  RISK_PROFILES: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },

  // Risk Adjustments
  RISK_ADJUSTMENTS: {
    low: 0.85,      // 15% discount
    medium: 1.00,   // No adjustment
    high: 1.25      // 25% surcharge
  },

  // HTTP Status Codes
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500
  }
};
