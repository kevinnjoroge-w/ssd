// USSD Menu Configuration
// In-memory USSD service adapted from user-provided flow

const DataService = require('./DataService');
const User = require('../models/User');
const FlutterwaveService = require('./FlutterwaveService');
const { v4: uuidv4 } = require('uuid');

class USSDService {
  /**
   * Process USSD request using the in-memory flow.
   * Signature kept compatible with existing callers: (sessionId, phoneNumber, text, user, currentMenu, sessionData)
   */
  static async processUSSD(sessionId, phoneNumber, text = '') {
    const serviceCode = '*123#';

    // 1. Get or create session from database
    let session = await DataService.getSession(sessionId);
    if (!session) {
      session = await DataService.upsertSession(sessionId, phoneNumber, {
        current_menu: 'main',
        session_data: {}
      });
    }

    // 1. Sanitization: Trim text and remove leading/trailing stars (some gateways include them)
    // Also handle empty or null text
    let sanitizedText = (text || '').trim();
    while (sanitizedText.startsWith('*')) sanitizedText = sanitizedText.substring(1);
    while (sanitizedText.endsWith('*')) sanitizedText = sanitizedText.substring(0, sanitizedText.length - 1);

    const rawText = sanitizedText;
    let textArray = rawText === '' ? [''] : rawText.split('*').map(t => t.trim());

    // Global transform for authenticated sessions to preserve original sub-flow indices
    if (session.session_data.authenticated && textArray.length > 1) {
      const authChoice = textArray[1];
      const mapping = {
        '1': '2', // Buy
        '2': '3', // Policies
        '3': '4', // Claim
        '4': '5', // Pay
        '5': '7', // Balance
        '6': '6', // Support
        '0': '0'  // Exit
      };

      const mappedChoice = mapping[authChoice] || authChoice;
      textArray = [mappedChoice, 'AUTH_SESSION', ...textArray.slice(2)];
    }

    let level = textArray.length;
    console.log(`[USSDService] textArray: ${JSON.stringify(textArray)}, level: ${level}`);

    let response = '';

    // Helper to return standard object
    const makeResult = (resp, nextMenu = 'main', cont = true, updates = null) => {
      const result = { response: resp, nextMenu, continueSession: cont };
      if (updates) result.updates = updates;
      return result;
    };

    // Main menu initial
    if (rawText === '') {
      const user = await User.query().findOne({ phone: phoneNumber });
      if (user && user.pin) {
        response = `CON Welcome back, ${user.name}!\nPlease enter your 4-digit PIN:`;
        return makeResult(response, 'awaiting_pin', true);
      }
      response = `CON Welcome to SafeCover Insurance\n1. Register\n2. Buy Insurance\n3. My Policies\n4. File a Claim\n5. Pay Premium\n6. Customer Support\n7. Check Balance\n0. Exit`;
      return makeResult(response, 'main', true);
    }

    // Handle PIN Authentication for returning users
    if (session.current_menu === 'awaiting_pin') {
      const pin = textArray[level - 1];
      const user = await User.query().findOne({ phone: phoneNumber });

      if (user && user.pin === pin) {
        session.session_data.authenticated = true;
        session.session_data.user = user;
        response = `CON Success! Select an option:\n1. Buy Insurance\n2. My Policies\n3. File a Claim\n4. Pay Premium\n5. Check Balance\n6. Customer Support\n0. Exit`;
        return makeResult(response, 'auth_main', true, { session_data: session.session_data });
      } else {
        response = `END Invalid PIN. Please try again.`;
        return makeResult(response, 'end', false);
      }
    }

    // (AUTH_MAIN local mapping removed - handled by global transform)

    // REGISTRATION FLOW
    if (textArray[0] === '1') {
      if (level === 1) {
        response = `CON Select user type:\n1. New Customer\n2. Existing Customer Login\n0. Back`;
        return makeResult(response, 'register', true);
      }
      // New Customer Registration
      if (textArray[1] === '1') {
        if (level === 2) {
          response = `CON Enter your National ID number:`;
          return makeResult(response, 'register', true);
        } else if (level === 3) {
          session.session_data.idNumber = textArray[2];
          response = `CON Enter your full name:`;
          return makeResult(response, 'register', true, { session_data: session.session_data });
        } else if (level === 4) {
          session.session_data.fullName = textArray[3];
          response = `CON Enter date of birth (DD/MM/YYYY):`;
          return makeResult(response, 'register', true, { session_data: session.session_data });
        } else if (level === 5) {
          session.session_data.dob = textArray[4];
          response = `CON Create a 4-digit PIN:`;
          return makeResult(response, 'register', true, { session_data: session.session_data });
        } else if (level === 6) {
          session.session_data.pin = textArray[level - 1];
          response = `CON Confirm your 4-digit PIN:`;
          return makeResult(response, 'register', true, { session_data: session.session_data });
        } else if (level === 7) {
          const confirmPin = textArray[level - 1];
          const originalPin = session.session_data.pin;

          if (confirmPin === originalPin) {
            const accountNumber = 'AC' + Date.now();
            const newUser = await DataService.getOrCreateUser(phoneNumber, session.session_data.fullName);
            await DataService.updateUserProfile(newUser.id, {
              pin: session.session_data.pin,
              occupation: 'Student', // Default or from session if collected
              income_range: 'low'    // Default
            });

            response = `END Registration successful!\nAccount Number: ${accountNumber}\nYou can now buy insurance.\nSMS confirmation sent to ${phoneNumber}`;
            return makeResult(response, 'end', false, { session_data: session.session_data });
          } else {
            response = `END PIN mismatch. Please try again.\nDial ${serviceCode} to restart.`;
            return makeResult(response, 'end', false);
          }
        }
      }
      // Existing Customer Login
      if (textArray[1] === '2') {
        if (level === 2) {
          response = `CON Enter your Account Number:`;
          return makeResult(response, 'login', true);
        } else if (level === 3) {
          session.session_data.accountNumber = textArray[2];
          response = `CON Enter your 4-digit PIN:`;
          return makeResult(response, 'login', true, { session_data: session.session_data });
        } else if (level === 4) {
          const pin = textArray[3];
          const user = await User.query().findOne({ phone: phoneNumber });
          if (user && user.pin === pin) {
            response = `END Welcome back, ${user.name}!\nDial ${serviceCode} to access services.`;
            return makeResult(response, 'end', false);
          } else {
            response = `END Invalid PIN.\nPlease try again.`;
            return makeResult(response, 'end', false);
          }
        }
      }
      if (textArray[1] === '0') {
        response = `CON Welcome to SafeCover Insurance\n1. Register\n2. Buy Insurance\n3. My Policies\n4. File a Claim\n5. Pay Premium\n6. Customer Support\n7. Check Balance\n0. Exit`;
        return makeResult(response, 'main', true);
      }
    }

    // BUY INSURANCE FLOW
    if (textArray[0] === '2') {
      if (level === 1) {
        response = `CON Enter your 4-digit PIN:`;
        return makeResult(response, 'buy', true);
      } else if (level === 2) {
        const pin = textArray[1];
        if (pin === 'AUTH_SESSION' && session.session_data.authenticated) {
          session.session_data.authenticatedUser = session.session_data.user;
        } else {
          const user = await DataService.getOrCreateUser(phoneNumber);
          if (!user || user.pin !== pin) {
            response = `END Incorrect PIN or not registered.\nPlease try again.`;
            return makeResult(response, 'end', false);
          }
          session.session_data.authenticatedUser = user;
        }
        response = `CON Select Insurance Type:\n1. Life Insurance\n2. Health Insurance\n3. Motor Insurance\n4. Home Insurance\n5. Education Insurance\n0. Back`;
        return makeResult(response, 'buy', true, { session_data: session.session_data });
      }
      // Life Insurance
      if (textArray[2] === '1') {
        if (level === 3) {
          response = `CON Life Insurance Plans:\n1. Basic - KES 200/month (Cover: 100K)\n2. Standard - KES 500/month (Cover: 500K)\n3. Premium - KES 1,000/month (Cover: 2M)\n0. Back`;
          return makeResult(response, 'buy', true);
        } else if (level === 4) {
          const plans = {
            '1': { name: 'Basic', premium: 200, cover: 100000 },
            '2': { name: 'Standard', premium: 500, cover: 500000 },
            '3': { name: 'Premium', premium: 1000, cover: 2000000 }
          };
          session.session_data.selectedPlan = plans[textArray[3]];
          response = `CON Enter beneficiary name:`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 5) {
          session.session_data.beneficiaryName = textArray[4];
          response = `CON Enter beneficiary phone number:`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 6) {
          session.session_data.beneficiaryPhone = textArray[5];
          const plan = session.session_data.selectedPlan;
          response = `CON Coverage Summary:\nPlan: ${plan.name} Life Cover\nPremium: KES ${plan.premium}/month\nCover: KES ${plan.cover}\nBeneficiary: ${session.session_data.beneficiaryName}\n\n1. Confirm & Pay\n2. Cancel`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 7) {
          if (textArray[6] === '1') {
            response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n3. Pay Later\n0. Back`;
            return makeResult(response, 'buy', true);
          } else {
            response = `END Purchase cancelled.`;
            return makeResult(response, 'end', false);
          }
        } else if (level === 8) {
          if (textArray[7] === '1' || textArray[7] === '2') {
            const plan = session.session_data.selectedPlan;
            const userRec = session.session_data.authenticatedUser;

            // Use DataService to create policy
            // We need a proper planId. For now, we'll try to find one or use a dummy ID for this flow.
            const dbPlan = await DataService.getPlanByCoverageType('basic'); // Fallback
            const policy = await DataService.createPolicy(userRec.id, dbPlan ? dbPlan.id : 'dummy-plan-id', plan.premium, plan.cover);

            const paymentMethod = textArray[7] === '1' ? 'M-PESA' : 'Airtel Money';
            response = `END Payment successful via ${paymentMethod}!\nPolicy Number: ${policy.policy_number}\nCoverage starts: ${new Date().toLocaleDateString()}\nNext premium due: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n\nSMS confirmation sent to ${phoneNumber}`;
            return makeResult(response, 'end', false, { session_data: session.session_data });
          } else if (textArray[7] === '3') {
            response = `END Pay Later selected.\nYou have 7 days to make payment.\nVisit any branch or dial ${serviceCode}`;
            return makeResult(response, 'end', false);
          }
        }
      }
      // Health Insurance
      if (textArray[2] === '2') {
        if (level === 3) {
          response = `CON Health Insurance Plans:\n1. Individual - KES 1,500/month\n2. Family (up to 5) - KES 4,000/month\n3. Senior Citizen - KES 2,500/month\n0. Back`;
          return makeResult(response, 'buy', true);
        } else if (level === 4) {
          const plans = {
            '1': { name: 'Individual', premium: 1500 },
            '2': { name: 'Family', premium: 4000 },
            '3': { name: 'Senior Citizen', premium: 2500 }
          };
          session.session_data.selectedPlan = plans[textArray[3]];
          response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n3. Pay Later\n0. Back`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 5) {
          const plan = session.session_data.selectedPlan;
          const userRec = session.session_data.authenticatedUser;

          const dbPlan = await DataService.getPlanByCoverageType('basic'); // Fallback or lookup based on selection
          const policy = await DataService.createPolicy(userRec.id, dbPlan ? dbPlan.id : 'health-plan-id', plan.premium, plan.premium * 500);

          response = `END Payment successful!\nPolicy Number: ${policy.policy_number}\nYour ${plan.name} health cover is now active.\nSMS confirmation sent.`;
          return makeResult(response, 'end', false, { session_data: session.session_data });
        }
      }
      // Motor Insurance
      if (textArray[2] === '3') {
        if (level === 3) {
          response = `CON Motor Insurance:\n1. Third Party - KES 5,000/year\n2. Comprehensive - KES 25,000/year\n0. Back`;
          return makeResult(response, 'buy', true);
        } else if (level === 4) {
          session.session_data.motorPlan = textArray[3];
          response = `CON Enter vehicle registration number:`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 5) {
          session.session_data.vehicleReg = textArray[4];
          response = `CON Enter vehicle make and model:\nExample: Toyota Corolla`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 6) {
          session.session_data.vehicleModel = textArray[5];
          const planType = textArray[3] === '1' ? 'Third Party' : 'Comprehensive';
          const premium = textArray[3] === '1' ? 5000 : 25000;
          response = `CON Vehicle: ${session.session_data.vehicleReg}\nModel: ${session.session_data.vehicleModel}\nPlan: ${planType}\nPremium: KES ${premium}/year\n\n1. Confirm & Pay\n2. Cancel`;
          return makeResult(response, 'buy', true, { session_data: session.session_data });
        } else if (level === 7) {
          if (textArray[6] === '1') {
            response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n0. Back`;
            return makeResult(response, 'buy', true);
          } else {
            response = `END Purchase cancelled.`;
            return makeResult(response, 'end', false);
          }
        } else if (level === 8) {
          const userRec = session.session_data.authenticatedUser;
          const planType = textArray[3] === '1' ? 'Third Party' : 'Comprehensive';
          const premium = textArray[3] === '1' ? 5000 : 25000;

          const dbPlan = await DataService.getPlanByCoverageType('standard'); // Fallback
          const policy = await DataService.createPolicy(userRec.id, dbPlan ? dbPlan.id : 'motor-plan-id', premium, premium * 50);

          response = `END Payment successful!\nPolicy Number: ${policy.policy_number}\nVehicle ${session.session_data.vehicleReg} is now insured.\nCertificate sent via SMS.`;
          return makeResult(response, 'end', false, { session_data: session.session_data });
        }
      }
      if (textArray[2] === '0') {
        response = `CON Welcome to SafeCover Insurance\n1. Register\n2. Buy Insurance\n3. My Policies\n4. File a Claim\n5. Pay Premium\n6. Customer Support\n7. Check Balance\n0. Exit`;
        return makeResult(response, 'main', true);
      }
    }

    // MY POLICIES FLOW
    if (textArray[0] === '3') {
      if (level === 1) {
        response = `CON Enter your 4-digit PIN:`;
        return makeResult(response, 'policies', true);
      } else if (level === 2) {
        const pin = textArray[1];
        if (pin === 'AUTH_SESSION' && session.session_data.authenticated) {
          session.session_data.authenticatedUser = session.session_data.user;
        } else {
          const user = await DataService.getOrCreateUser(phoneNumber);
          if (!user || user.pin !== pin) {
            response = `END Incorrect PIN or not registered.`;
            return makeResult(response, 'end', false);
          }
          session.session_data.authenticatedUser = user;
        }

        const currentUser = session.session_data.authenticatedUser;
        const userPolicies = await DataService.getUserActivePolicies(currentUser.id);

        if (userPolicies.length === 0) {
          response = `END You have no active policies.\nDial ${serviceCode} to buy insurance.`;
          return makeResult(response, 'end', false);
        } else {
          let policyList = 'CON Your Active Policies:\n';
          userPolicies.forEach((policy, index) => {
            policyList += `${index + 1}. ${policy.plan?.name || 'Policy'} - ${policy.policy_number}\n`;
          });
          policyList += '0. Back';
          response = policyList;
          return makeResult(response, 'policies', true, { session_data: session.session_data });
        }
      } else if (level === 3) {
        const currentUser = session.session_data.authenticatedUser;
        const userPolicies = await DataService.getUserActivePolicies(currentUser.id);
        const selectedIndex = parseInt(textArray[2]) - 1;

        if (selectedIndex >= 0 && selectedIndex < userPolicies.length) {
          const policy = userPolicies[selectedIndex];
          response = `END Policy Details:\nType: ${policy.plan?.name || 'Policy'}\nPolicy No: ${policy.policy_number}\nPremium: KES ${policy.premium}\nStatus: ${policy.status}\nStart Date: ${policy.start_date}\nEnd Date: ${policy.end_date}\n\nSMS sent with full details.`;
          return makeResult(response, 'end', false);
        } else {
          response = `END Invalid selection.`;
          return makeResult(response, 'end', false);
        }
      }
    }

    // FILE A CLAIM FLOW
    if (textArray[0] === '4') {
      if (level === 1) {
        response = `CON Enter your 4-digit PIN:`;
        return makeResult(response, 'claim', true);
      } else if (level === 2) {
        const pin = textArray[1];
        if (pin === 'AUTH_SESSION' && session.session_data.authenticated) {
          session.session_data.authenticatedUser = session.session_data.user;
        } else {
          const user = await DataService.getOrCreateUser(phoneNumber);
          if (!user || user.pin !== pin) {
            response = `END Incorrect PIN or not registered.`;
            return makeResult(response, 'end', false);
          }
          session.session_data.authenticatedUser = user;
        }

        const currentUser = session.session_data.authenticatedUser;
        const userPolicies = await DataService.getUserActivePolicies(currentUser.id);
        if (userPolicies.length === 0) {
          response = `END You have no active policies to claim.`;
          return makeResult(response, 'end', false);
        } else {
          let policyList = 'CON Select policy to claim:\n';
          userPolicies.forEach((policy, index) => {
            policyList += `${index + 1}. ${policy.plan?.name || 'Policy'} - ${policy.policy_number}\n`;
          });
          policyList += '0. Back';
          response = policyList;
          return makeResult(response, 'claim', true, { session_data: session.session_data });
        }
      } else if (level === 3) {
        session.session_data.selectedPolicyIndex = parseInt(textArray[2]) - 1;
        response = `CON Select claim type:\n1. Hospital/Medical\n2. Accident\n3. Death Claim\n4. Property Damage\n0. Back`;
        return makeResult(response, 'claim', true, { session_data: session.session_data });
      } else if (level === 4) {
        session.session_data.claimType = textArray[3];
        response = `CON Enter claim amount (KES):`;
        return makeResult(response, 'claim', true, { session_data: session.session_data });
      } else if (level === 5) {
        session.session_data.claimAmount = textArray[4];
        response = `CON Enter incident date (DD/MM/YYYY):`;
        return makeResult(response, 'claim', true, { session_data: session.session_data });
      } else if (level === 6) {
        session.session_data.incidentDate = textArray[5];
        response = `CON Brief description:\n(Max 160 characters)`;
        return makeResult(response, 'claim', true, { session_data: session.session_data });
      } else if (level === 7) {
        const claimRef = 'CLM' + Date.now();
        response = `END Claim submitted successfully!\nClaim Reference: ${claimRef}\nExpected response: 48 hours\n\nRequired documents:\n- Hospital invoice\n- ID copy\n- Police report (if applicable)\n\nSend to WhatsApp: +254700123456\nEmail: claims@safecover.co.ke`;
        return makeResult(response, 'end', false, { session_data: session.session_data });
      }
    }

    // PAY PREMIUM FLOW
    if (textArray[0] === '5') {
      console.log(`[USSDService] Entering PAY PREMIUM FLOW. level: ${level}, type: ${typeof level}`);
      if (level === 1) {
        response = `CON Enter your 4-digit PIN:`;
        return makeResult(response, 'pay', true);
      } else if (level === 2) {
        const pin = textArray[1];
        if (pin === 'AUTH_SESSION' && session.session_data.authenticated) {
          session.session_data.authenticatedUser = session.session_data.user;
        } else {
          const user = await DataService.getOrCreateUser(phoneNumber);
          if (!user || user.pin !== pin) {
            response = `END Incorrect PIN or not registered.`;
            return makeResult(response, 'end', false);
          }
          session.session_data.authenticatedUser = user;
        }

        const currentUser = session.session_data.authenticatedUser;
        const userPolicies = await DataService.getUserActivePolicies(currentUser.id);
        if (userPolicies.length === 0) {
          response = `END You have no policies requiring payment.`;
          return makeResult(response, 'end', false);
        } else {
          let paymentList = 'CON Outstanding Premiums:\n';
          let totalDue = 0;
          userPolicies.forEach((policy, index) => {
            paymentList += `${index + 1}. ${policy.plan?.name || 'Policy'} - KES ${policy.premium}\n`;
            totalDue += policy.premium;
          });
          paymentList += `${userPolicies.length + 1}. Pay All - KES ${totalDue}\n`;
          paymentList += '0. Back';
          response = paymentList;
          return makeResult(response, 'pay', true, { session_data: session.session_data });
        }
      } else if (level === 3) {
        const currentUser = session.session_data.authenticatedUser;
        const userPolicies = await DataService.getUserActivePolicies(currentUser.id);
        const selection = parseInt(textArray[2]);
        if (selection === userPolicies.length + 1) {
          const total = userPolicies.reduce((sum, p) => sum + p.premium, 0);
          session.session_data.paymentAmount = total;
          response = `CON Pay KES ${total} for all policies?\n\n1. Confirm & Pay\n2. Cancel`;
          return makeResult(response, 'pay', true, { session_data: session.session_data });
        } else if (selection > 0 && selection <= userPolicies.length) {
          const policy = userPolicies[selection - 1];
          session.session_data.paymentAmount = policy.premium;
          session.session_data.paymentPolicy = policy;
          response = `CON Pay KES ${policy.premium} for ${policy.plan?.name || 'Policy'}?\nPolicy: ${policy.policy_number}\n\n1. Confirm & Pay\n2. Cancel`;
          return makeResult(response, 'pay', true, { session_data: session.session_data });
        }
      } else if (level === 4) {
        if (textArray[3] === '1') {
          response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n0. Back`;
          return makeResult(response, 'pay', true);
        } else {
          response = `END Payment cancelled.`;
          return makeResult(response, 'end', false);
        }
      } else if (level === 5) {
        console.log(`[USSDService] Entering level 5. session_data: ${JSON.stringify(session.session_data)}`);
        // Initiate Real Flutterwave Payment
        try {
          const transactionId = uuidv4();
          const amount = session.session_data.paymentAmount;
          const currentUser = session.session_data.authenticatedUser;
          const policy = session.session_data.paymentPolicy;

          // 1. Create payment record
          await DataService.createPayment(
            currentUser.id,
            policy ? policy.id : null,
            amount,
            'flutterwave',
            transactionId
          );

          // 2. Initiate STK Push via Flutterwave
          const flwResult = await FlutterwaveService.initiateMobileMoneyPayment(
            phoneNumber,
            amount,
            transactionId,
            currentUser.email || (phoneNumber + '@ussd-insurance.com'),
            currentUser.name
          );

          if (flwResult.success) {
            // Attach FLW reference
            if (flwResult.flwRef) {
              await DataService.attachFlwRef(transactionId, flwResult.flwRef);
            }
            response = `END Payment of KES ${amount} initiated.\nPlease check your phone for the M-PESA STK push to complete the payment.`;
          } else {
            response = `END Payment initiation failed: ${flwResult.message || 'Unknown error'}.\nPlease try again later.`;
          }

          return makeResult(response, 'end', false, { session_data: session.session_data });
        } catch (error) {
          console.error('USSD Payment Error:', error);
          response = `END Sorry, we encountered an error while processing your payment. Please try again later.`;
          return makeResult(response, 'end', false);
        }
      }
    }

    // CUSTOMER SUPPORT FLOW
    if (textArray[0] === '6') {
      if (level === 1) {
        response = `CON Customer Support:\n1. Call Us: 0800 123 456\n2. Request Call Back\n3. FAQ\n4. Email: support@safecover.co.ke\n0. Back`;
        return makeResult(response, 'support', true);
      } else if (textArray[1] === '1') {
        response = `END Calling 0800 123 456...\nOur support team is available 24/7.`;
        return makeResult(response, 'end', false);
      } else if (textArray[1] === '2') {
        response = `END Call back request received!\nWe'll call ${phoneNumber} within 2 hours.`;
        return makeResult(response, 'end', false);
      } else if (textArray[1] === '3') {
        response = `CON FAQ:\n1. How to file a claim\n2. Payment methods\n3. Policy renewal\n4. Coverage details\n0. Back`;
        return makeResult(response, 'support', true);
      }
    }

    // CHECK BALANCE FLOW
    if (textArray[0] === '7') {
      if (level === 1) {
        response = `CON Enter your 4-digit PIN:`;
        return makeResult(response, 'balance', true);
      } else if (level === 2) {
        const pin = textArray[1];
        if (pin === 'AUTH_SESSION' && session.session_data.authenticated) {
          session.session_data.authenticatedUser = session.session_data.user;
        } else {
          const user = await DataService.getOrCreateUser(phoneNumber);
          if (!user || user.pin !== pin) {
            response = `END Incorrect PIN or not registered.`;
            return makeResult(response, 'end', false);
          }
          session.session_data.authenticatedUser = user;
        }

        const currentUser = session.session_data.authenticatedUser;
        const userPolicies = await DataService.getUserActivePolicies(currentUser.id);
        const totalCoverage = userPolicies.reduce((sum, p) => sum + (p.coverage_amount || 0), 0);
        const pendingPremiums = userPolicies.reduce((sum, p) => sum + p.premium, 0);
        response = `END Account Summary:\nAccount: ${currentUser.id.substring(0, 8)}\nActive Policies: ${userPolicies.length}\nTotal Coverage: KES ${totalCoverage}\n\nPending Premiums: KES ${pendingPremiums}\n\nDial ${serviceCode} for more options.`;
        return makeResult(response, 'end', false);
      }
    }

    // EXIT
    if (textArray[0] === '0') {
      response = `END Thank you for using SafeCover Insurance.\nFor support: 0800 123 456\nDial ${serviceCode} anytime.`;
      return makeResult(response, 'end', false);
    }

    // Default fallback
    response = `END Invalid selection.\nPlease dial ${serviceCode} again.`;
    return makeResult(response, 'end', false);
  }

  // Keep compatibility helpers in case other modules call them
  static formatResponse(text) {
    const response = String(text);
    // Truncate long lines to 160 characters for USSD compatibility
    return response.split('\n').map(line => line.length > 160 ? line.substring(0, 160) : line).join('\n');
  }

  static recommendPlan(premium) {
    if (premium < 100) return { type: 'basic', name: 'Basic Health' };
    if (premium <= 300) return { type: 'standard', name: 'Standard Health' };
    return { type: 'comprehensive', name: 'Comprehensive Health' };
  }

  static calculateRecommendedCoverage(premium, multiplier = 500) {
    const coverage = premium * multiplier;
    return Math.min(coverage, 500000);
  }
}

module.exports = USSDService;
