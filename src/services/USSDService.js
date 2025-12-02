// USSD Menu Configuration
const MENUS = {
  main: {
    en: `CON Welcome to InsureMe Kenya!
1. Register
2. My Plans
3. Buy Insurance
4. Pay Premium
5. Check Balance
0. Exit`,
    sw: `CON Karibu InsureMe Kenya!
1. Jandika
2. Mitaa yangu
3. Nunua Bima
4. Lipa Mkakati
5. Angalia Salio
0. Ondoka`
  },
  
  register: {
    en: `CON Enter your full name:`,
    sw: `CON Ingiza jina lako:` 
  },

  register_occupation: {
    en: `CON What is your occupation?
1. Student
2. Employed
3. Self-employed
4. Unemployed
5. Other`,
    sw: `CON Kazi yako ni nini?
1. Mwanafunzi
2. Mwajiriwa
3. Mjinyamasi
4. Hajabwajiriwa
5. Nyingine`
  },

  register_income: {
    en: `CON What is your income range?
1. Low (< 20,000 KES)
2. Medium (20,000 - 50,000 KES)
3. High (> 50,000 KES)`,
    sw: `CON Kiwango cha matumizi yako?
1. Chini (< 20,000 KES)
2. Katati (20,000 - 50,000 KES)
3. Juu (> 50,000 KES)`
  },

  buy_insurance: {
    en: `CON Select Plan:
1. Basic Health (50-100 KES/month)
2. Standard Health (100-300 KES/month)
3. Comprehensive (300-500 KES/month)
0. Back`,
    sw: `CON Chagua Mitaa:
1. Afya ya Kawaida (50-100 KES/month)
2. Afya ya Kawaida (100-300 KES/month)
3. Komprehensiv (300-500 KES/month)
0. Nyuma`
  },

  enter_premium: {
    en: `CON Enter monthly premium (50-500 KES):`,
    sw: `CON Ingiza kiwango cha kila mwezi (50-500 KES):`
  },

  confirm_purchase: {
    en: (planName, premium, coverage) => 
      `CON Confirm Purchase:
Plan: ${planName}
Premium: ${premium} KES/month
Coverage: ${coverage} KES

1. Confirm
2. Cancel`,
    sw: (planName, premium, coverage) =>
      `CON Thibitisha Ununuzi:
Mitaa: ${planName}
Kiwango: ${premium} KES/month
Jalada: ${coverage} KES

1. Thibitisha
2. Kataa`
  },

  pay_premium: {
    en: `CON You will receive an M-Pesa prompt.
Your payment will be processed.
Thank you!`,
    sw: `CON Utapokea ujumbe wa M-Pesa.
Malipo yako yatachakatwa.
Asante!`
  },

  check_balance: {
    en: (planName, coverage, status) =>
      `END Your Active Policy:
Plan: ${planName}
Coverage: ${coverage} KES
Status: ${status}
Expires: 30 days
Thank you for using InsureMe!`,
    sw: (planName, coverage, status) =>
      `END Mtaa Wako Wenye Ufanisi:
Plan: ${planName}
Jalada: ${coverage} KES
Status: ${status}
Umechelewa: Siku 30
Asante kwa kutumia InsureMe!`
  },

  error: {
    en: `END An error occurred. Please try again later.`,
    sw: `END Kosa limetokea. Tafadhali jaribu baadaye.`
  }
};

class USSDService {
  /**
   * Process USSD request
   */
  static async processUSSD(sessionId, phoneNumber, text, user) {
    try {
      // Determine which menu to show based on input
      const response = this.handleMenuLogic(text, user);
      return response;
    } catch (error) {
      console.error('USSD Processing Error:', error);
      throw error;
    }
  }

  /**
   * Main menu logic handler
   */
  static handleMenuLogic(userInput, user) {
    const language = user?.preferred_language || 'en';
    const trimmedInput = userInput.trim();
    
    // Initial request (empty string)
    if (!trimmedInput) {
      return {
        response: MENUS.main[language],
        nextMenu: 'main',
        continueSession: true
      };
    }

    const userChoice = trimmedInput.split('*').pop(); // Get last input
    
    switch (userChoice) {
      case '1': // Register
        return {
          response: MENUS.register[language],
          nextMenu: 'register_name',
          continueSession: true
        };
      
      case '2': // My Plans
        return this.handleMyPlans(user, language);
      
      case '3': // Buy Insurance
        return {
          response: MENUS.buy_insurance[language],
          nextMenu: 'select_plan',
          continueSession: true
        };
      
      case '4': // Pay Premium
        return this.handlePayPremium(user, language);
      
      case '5': // Check Balance
        return this.handleCheckBalance(user, language);
      
      case '0': // Exit
        return {
          response: `END Thank you for using InsureMe!`,
          nextMenu: 'end',
          continueSession: false
        };
      
      default:
        return {
          response: MENUS.error[language],
          nextMenu: 'error',
          continueSession: false
        };
    }
  }

  /**
   * Handle My Plans menu
   */
  static handleMyPlans(user, language) {
    if (!user || !user.policies) {
      const msg = language === 'en' 
        ? `END You have no active policies.
Dial *123# to buy insurance.`
        : `END Haina mitaa benki.
Piga simu *123# kununua bima.`;
      
      return {
        response: msg,
        nextMenu: 'end',
        continueSession: false
      };
    }

    // Format active policies
    const policy = user.policies[0];
    const plan = policy.plan;
    const text = language === 'en'
      ? `END Your Active Policy:
Plan: ${plan.name}
Premium: ${policy.premium} KES/month
Coverage: ${policy.coverage_amount} KES
Status: ${policy.status}`
      : `END Mtaa Wako Wenye Ufanisi:
Jina: ${plan.name}
Malipo: ${policy.premium} KES/month
Jalada: ${policy.coverage_amount} KES
Hadhi: ${policy.status}`;

    return {
      response: text,
      nextMenu: 'end',
      continueSession: false
    };
  }

  /**
   * Handle Pay Premium
   */
  static handlePayPremium(user, language) {
    if (!user || !user.policies || user.policies.length === 0) {
      const msg = language === 'en'
        ? `END You have no active policies to pay for.`
        : `END Haina mitaa ya kulipa.`;
      
      return {
        response: msg,
        nextMenu: 'end',
        continueSession: false
      };
    }

    return {
      response: MENUS.pay_premium[language],
      nextMenu: 'process_payment',
      continueSession: true,
      trigger_mpesa: true
    };
  }

  /**
   * Handle Check Balance
   */
  static handleCheckBalance(user, language) {
    if (!user || !user.policies || user.policies.length === 0) {
      const msg = language === 'en'
        ? `END You have no active policies.`
        : `END Haina mitaa benki.`;
      
      return {
        response: msg,
        nextMenu: 'end',
        continueSession: false
      };
    }

    const policy = user.policies[0];
    const plan = policy.plan;
    const response = typeof MENUS.check_balance[language] === 'function'
      ? MENUS.check_balance[language](plan.name, policy.coverage_amount, policy.status)
      : MENUS.check_balance[language];

    return {
      response,
      nextMenu: 'end',
      continueSession: false
    };
  }

  /**
   * Calculate recommended coverage based on premium
   */
  static calculateRecommendedCoverage(premium, multiplier = 500) {
    const coverage = premium * multiplier;
    return Math.min(coverage, 500000); // Cap at 500k
  }

  /**
   * Recommend plan based on premium
   */
  static recommendPlan(premium) {
    if (premium < 100) {
      return { type: 'basic', name: 'Basic Health' };
    } else if (premium < 300) {
      return { type: 'standard', name: 'Standard Health' };
    } else {
      return { type: 'comprehensive', name: 'Comprehensive Health' };
    }
  }

  /**
   * Format USSD response (ensure 160 chars max per line)
   */
  static formatResponse(text) {
    const lines = text.split('\n');
    const formatted = lines.map(line => {
      if (line.length > 160) {
        return line.substring(0, 160);
      }
      return line;
    });
    return formatted.join('\n');
  }
}

module.exports = USSDService;
