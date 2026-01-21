const USSDService = require('../services/USSDService');
const DataService = require('../services/DataService');
const MpesaService = require('../services/MpesaService');

// In-memory storage (used for simplified USSD flow per user's request)
const users = {};
const policies = {};
const claims = {};
const sessions = {};

class USSDController {
  /**
   * Handle incoming USSD request (in-memory flow adapted from user's sample)
   */
  static async handleUSSD(req, res) {
    try {
      const { sessionId, serviceCode, phoneNumber, text = '' } = req.body;

      if (!sessionId || !phoneNumber) {
        return res.status(400).json({ error: 'Missing required fields: sessionId, phoneNumber' });
      }

      let response = '';
      const textArray = (text || '').split('*');
      const level = textArray.filter(Boolean).length || (text === '' ? 0 : textArray.length);

      // Store session data
      if (!sessions[sessionId]) {
        sessions[sessionId] = { phoneNumber, data: {} };
      }
      const session = sessions[sessionId];

      if (text === '') {
        // Main menu
        response = `CON Welcome to SafeCover Insurance\n1. Register\n2. Buy Insurance\n3. My Policies\n4. File a Claim\n5. Pay Premium\n6. Customer Support\n7. Check Balance\n0. Exit`;
      }
      // REGISTRATION FLOW
      else if (textArray[0] === '1') {
        if (level === 1) {
          response = `CON Select user type:\n1. New Customer\n2. Existing Customer Login\n0. Back`;
        } else if (textArray[1] === '1') {
          // New Customer Registration
          if (level === 2) {
            response = `CON Enter your National ID number:`;
          } else if (level === 3) {
            session.data.idNumber = textArray[2];
            response = `CON Enter your full name:`;
          } else if (level === 4) {
            session.data.fullName = textArray[3];
            response = `CON Enter date of birth (DD/MM/YYYY):`;
          } else if (level === 5) {
            session.data.dob = textArray[4];
            response = `CON Create a 4-digit PIN:`;
          } else if (level === 6) {
            session.data.pin = textArray[5];
            response = `CON Confirm your 4-digit PIN:`;
          } else if (level === 7) {
            const confirmPin = textArray[6];
            if (confirmPin === session.data.pin) {
              const accountNumber = 'AC' + Date.now();
              users[phoneNumber] = {
                accountNumber,
                idNumber: session.data.idNumber,
                fullName: session.data.fullName,
                dob: session.data.dob,
                pin: session.data.pin,
                phoneNumber
              };
              response = `END Registration successful!\nAccount Number: ${accountNumber}\nYou can now buy insurance.\nSMS confirmation sent to ${phoneNumber}`;
            } else {
              response = `END PIN mismatch. Please try again.\nDial ${serviceCode} to restart.`;
            }
          }
        } else if (textArray[1] === '2') {
          // Existing Customer Login
          if (level === 2) {
            response = `CON Enter your Account Number:`;
          } else if (level === 3) {
            session.data.accountNumber = textArray[2];
            response = `CON Enter your 4-digit PIN:`;
          } else if (level === 4) {
            const pin = textArray[3];
            const user = Object.values(users).find(u => u.accountNumber === session.data.accountNumber && u.pin === pin);
            if (user) {
              response = `END Welcome back, ${user.fullName}!\nDial ${serviceCode} to access services.`;
            } else {
              response = `END Invalid credentials.\nPlease try again.`;
            }
          }
        } else if (textArray[1] === '0') {
          response = `CON Welcome to SafeCover Insurance\n1. Register\n2. Buy Insurance\n3. My Policies\n4. File a Claim\n5. Pay Premium\n6. Customer Support\n7. Check Balance\n0. Exit`;
        }
      }
      // BUY INSURANCE FLOW
      else if (textArray[0] === '2') {
        if (level === 1) {
          response = `CON Enter your 4-digit PIN:`;
        } else if (level === 2) {
          const pin = textArray[1];
          const user = Object.values(users).find(u => u.phoneNumber === phoneNumber && u.pin === pin);
          if (!user) {
            response = `END Incorrect PIN or not registered.\nPlease try again.`;
          } else {
            session.data.authenticatedUser = user;
            response = `CON Select Insurance Type:\n1. Life Insurance\n2. Health Insurance\n3. Motor Insurance\n4. Home Insurance\n5. Education Insurance\n0. Back`;
          }
        }
        // Life Insurance
        else if (textArray[2] === '1') {
          if (level === 3) {
            response = `CON Life Insurance Plans:\n1. Basic - KES 200/month (Cover: 100K)\n2. Standard - KES 500/month (Cover: 500K)\n3. Premium - KES 1,000/month (Cover: 2M)\n0. Back`;
          } else if (level === 4) {
            const plans = {
              '1': { name: 'Basic', premium: 200, cover: 100000 },
              '2': { name: 'Standard', premium: 500, cover: 500000 },
              '3': { name: 'Premium', premium: 1000, cover: 2000000 }
            };
            session.data.selectedPlan = plans[textArray[3]];
            response = `CON Enter beneficiary name:`;
          } else if (level === 5) {
            session.data.beneficiaryName = textArray[4];
            response = `CON Enter beneficiary phone number:`;
          } else if (level === 6) {
            session.data.beneficiaryPhone = textArray[5];
            const plan = session.data.selectedPlan;
            response = `CON Coverage Summary:\nPlan: ${plan.name} Life Cover\nPremium: KES ${plan.premium}/month\nCover: KES ${plan.cover}\nBeneficiary: ${session.data.beneficiaryName}\n\n1. Confirm & Pay\n2. Cancel`;
          } else if (level === 7) {
            if (textArray[6] === '1') {
              response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n3. Pay Later\n0. Back`;
            } else {
              response = `END Purchase cancelled.`;
            }
          } else if (level === 8) {
            if (textArray[7] === '1' || textArray[7] === '2') {
              const policyNumber = 'POL' + Date.now();
              const plan = session.data.selectedPlan;
              const user = session.data.authenticatedUser;
              
              if (!policies[user.accountNumber]) {
                policies[user.accountNumber] = [];
              }
              
              policies[user.accountNumber].push({
                policyNumber,
                type: 'Life Insurance',
                plan: plan.name,
                premium: plan.premium,
                cover: plan.cover,
                beneficiary: session.data.beneficiaryName,
                beneficiaryPhone: session.data.beneficiaryPhone,
                status: 'Active',
                startDate: new Date().toLocaleDateString(),
                nextDue: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()
              });
              
              const paymentMethod = textArray[7] === '1' ? 'M-PESA' : 'Airtel Money';
              response = `END Payment successful via ${paymentMethod}!\nPolicy Number: ${policyNumber}\nCoverage starts: ${new Date().toLocaleDateString()}\nNext premium due: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}\n\nSMS confirmation sent to ${phoneNumber}`;
            } else if (textArray[7] === '3') {
              response = `END Pay Later selected.\nYou have 7 days to make payment.\nVisit any branch or dial ${serviceCode}`;
            }
          }
        }
        // Health Insurance
        else if (textArray[2] === '2') {
          if (level === 3) {
            response = `CON Health Insurance Plans:\n1. Individual - KES 1,500/month\n2. Family (up to 5) - KES 4,000/month\n3. Senior Citizen - KES 2,500/month\n0. Back`;
          } else if (level === 4) {
            const plans = {
              '1': { name: 'Individual', premium: 1500 },
              '2': { name: 'Family', premium: 4000 },
              '3': { name: 'Senior Citizen', premium: 2500 }
            };
            session.data.selectedPlan = plans[textArray[3]];
            response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n3. Pay Later\n0. Back`;
          } else if (level === 5) {
            const policyNumber = 'POL' + Date.now();
            const plan = session.data.selectedPlan;
            const user = session.data.authenticatedUser;
            
            if (!policies[user.accountNumber]) {
              policies[user.accountNumber] = [];
            }
            
            policies[user.accountNumber].push({
              policyNumber,
              type: 'Health Insurance',
              plan: plan.name,
              premium: plan.premium,
              status: 'Active',
              startDate: new Date().toLocaleDateString(),
              nextDue: new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()
            });
            
            response = `END Payment successful!\nPolicy Number: ${policyNumber}\nYour ${plan.name} health cover is now active.\nSMS confirmation sent.`;
          }
        }
        // Motor Insurance
        else if (textArray[2] === '3') {
          if (level === 3) {
            response = `CON Motor Insurance:\n1. Third Party - KES 5,000/year\n2. Comprehensive - KES 25,000/year\n0. Back`;
          } else if (level === 4) {
            session.data.motorPlan = textArray[3];
            response = `CON Enter vehicle registration number:`;
          } else if (level === 5) {
            session.data.vehicleReg = textArray[4];
            response = `CON Enter vehicle make and model:\nExample: Toyota Corolla`;
          } else if (level === 6) {
            session.data.vehicleModel = textArray[5];
            const planType = textArray[3] === '1' ? 'Third Party' : 'Comprehensive';
            const premium = textArray[3] === '1' ? 5000 : 25000;
            response = `CON Vehicle: ${session.data.vehicleReg}\nModel: ${session.data.vehicleModel}\nPlan: ${planType}\nPremium: KES ${premium}/year\n\n1. Confirm & Pay\n2. Cancel`;
          } else if (level === 7) {
            if (textArray[6] === '1') {
              response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n0. Back`;
            } else {
              response = `END Purchase cancelled.`;
            }
          } else if (level === 8) {
            const policyNumber = 'POL' + Date.now();
            const user = session.data.authenticatedUser;
            const planType = textArray[3] === '1' ? 'Third Party' : 'Comprehensive';
            const premium = textArray[3] === '1' ? 5000 : 25000;
            
            if (!policies[user.accountNumber]) {
              policies[user.accountNumber] = [];
            }
            
            policies[user.accountNumber].push({
              policyNumber,
              type: 'Motor Insurance',
              plan: planType,
              premium: premium,
              vehicleReg: session.data.vehicleReg,
              vehicleModel: session.data.vehicleModel,
              status: 'Active',
              startDate: new Date().toLocaleDateString()
            });
            
            response = `END Payment successful!\nPolicy Number: ${policyNumber}\nVehicle ${session.data.vehicleReg} is now insured.\nCertificate sent via SMS.`;
          }
        } else if (textArray[2] === '0') {
          response = `CON Welcome to SafeCover Insurance\n1. Register\n2. Buy Insurance\n3. My Policies\n4. File a Claim\n5. Pay Premium\n6. Customer Support\n7. Check Balance\n0. Exit`;
        }
      }
      // MY POLICIES FLOW
      else if (textArray[0] === '3') {
        if (level === 1) {
          response = `CON Enter your 4-digit PIN:`;
        } else if (level === 2) {
          const pin = textArray[1];
          const user = Object.values(users).find(u => u.phoneNumber === phoneNumber && u.pin === pin);
          if (!user) {
            response = `END Incorrect PIN or not registered.`;
          } else {
            session.data.authenticatedUser = user;
            const userPolicies = policies[user.accountNumber] || [];
            
            if (userPolicies.length === 0) {
              response = `END You have no active policies.\nDial ${serviceCode} to buy insurance.`;
            } else {
              let policyList = 'CON Your Active Policies:\n';
              userPolicies.forEach((policy, index) => {
                policyList += `${index + 1}. ${policy.type}\n   ${policy.policyNumber}\n`;
              });
              policyList += '0. Back';
              response = policyList;
            }
          }
        } else if (level === 3) {
          const user = session.data.authenticatedUser;
          const userPolicies = policies[user.accountNumber] || [];
          const selectedIndex = parseInt(textArray[2]) - 1;
          
          if (selectedIndex >= 0 && selectedIndex < userPolicies.length) {
            const policy = userPolicies[selectedIndex];
            response = `END Policy Details:\nType: ${policy.type}\nPolicy No: ${policy.policyNumber}\nPremium: KES ${policy.premium}\nStatus: ${policy.status}\nStart Date: ${policy.startDate}\n${policy.nextDue ? 'Next Due: ' + policy.nextDue : ''}\n\nSMS sent with full details.`;
          } else {
            response = `END Invalid selection.`;
          }
        }
      }
      // FILE A CLAIM FLOW
      else if (textArray[0] === '4') {
        if (level === 1) {
          response = `CON Enter your 4-digit PIN:`;
        } else if (level === 2) {
          const pin = textArray[1];
          const user = Object.values(users).find(u => u.phoneNumber === phoneNumber && u.pin === pin);
          if (!user) {
            response = `END Incorrect PIN or not registered.`;
          } else {
            session.data.authenticatedUser = user;
            const userPolicies = policies[user.accountNumber] || [];
            
            if (userPolicies.length === 0) {
              response = `END You have no active policies to claim.`;
            } else {
              let policyList = 'CON Select policy to claim:\n';
              userPolicies.forEach((policy, index) => {
                policyList += `${index + 1}. ${policy.type} - ${policy.policyNumber}\n`;
              });
              policyList += '0. Back';
              response = policyList;
            }
          }
        } else if (level === 3) {
          session.data.selectedPolicyIndex = parseInt(textArray[2]) - 1;
          response = `CON Select claim type:\n1. Hospital/Medical\n2. Accident\n3. Death Claim\n4. Property Damage\n0. Back`;
        } else if (level === 4) {
          session.data.claimType = textArray[3];
          response = `CON Enter claim amount (KES):`;
        } else if (level === 5) {
          session.data.claimAmount = textArray[4];
          response = `CON Enter incident date (DD/MM/YYYY):`;
        } else if (level === 6) {
          session.data.incidentDate = textArray[5];
          response = `CON Brief description:\n(Max 160 characters)`;
        } else if (level === 7) {
          const claimRef = 'CLM' + Date.now();
          const user = session.data.authenticatedUser;
          const userPolicies = policies[user.accountNumber];
          const policy = userPolicies[session.data.selectedPolicyIndex];
          
          if (!claims[user.accountNumber]) {
            claims[user.accountNumber] = [];
          }
          
          claims[user.accountNumber].push({
            claimRef,
            policyNumber: policy.policyNumber,
            amount: session.data.claimAmount,
            type: session.data.claimType,
            date: session.data.incidentDate,
            description: textArray[6],
            status: 'Under Review',
            submittedDate: new Date().toLocaleDateString()
          });
          
          response = `END Claim submitted successfully!\nClaim Reference: ${claimRef}\nExpected response: 48 hours\n\nRequired documents:\n- Hospital invoice\n- ID copy\n- Police report (if applicable)\n\nSend to WhatsApp: +254700123456\nEmail: claims@safecover.co.ke`;
        }
      }
      // PAY PREMIUM FLOW
      else if (textArray[0] === '5') {
        if (level === 1) {
          response = `CON Enter your 4-digit PIN:`;
        } else if (level === 2) {
          const pin = textArray[1];
          const user = Object.values(users).find(u => u.phoneNumber === phoneNumber && u.pin === pin);
          if (!user) {
            response = `END Incorrect PIN or not registered.`;
          } else {
            session.data.authenticatedUser = user;
            const userPolicies = policies[user.accountNumber] || [];
            
            if (userPolicies.length === 0) {
              response = `END You have no policies requiring payment.`;
            } else {
              let paymentList = 'CON Outstanding Premiums:\n';
              let totalDue = 0;
              userPolicies.forEach((policy, index) => {
                paymentList += `${index + 1}. ${policy.type} - KES ${policy.premium}\n`;
                totalDue += policy.premium;
              });
              paymentList += `${userPolicies.length + 1}. Pay All - KES ${totalDue}\n`;
              paymentList += '0. Back';
              response = paymentList;
            }
          }
        } else if (level === 3) {
          const user = session.data.authenticatedUser;
          const userPolicies = policies[user.accountNumber];
          const selection = parseInt(textArray[2]);
          
          if (selection === userPolicies.length + 1) {
            const total = userPolicies.reduce((sum, p) => sum + p.premium, 0);
            session.data.paymentAmount = total;
            response = `CON Pay KES ${total} for all policies?\n\n1. Confirm & Pay\n2. Cancel`;
          } else if (selection > 0 && selection <= userPolicies.length) {
            const policy = userPolicies[selection - 1];
            session.data.paymentAmount = policy.premium;
            session.data.paymentPolicy = policy;
            response = `CON Pay KES ${policy.premium} for ${policy.type}?\nPolicy: ${policy.policyNumber}\n\n1. Confirm & Pay\n2. Cancel`;
          } else {
            response = `END Invalid selection.`;
          }
        } else if (level === 4) {
          if (textArray[3] === '1') {
            response = `CON Select payment method:\n1. M-PESA\n2. Airtel Money\n0. Back`;
          } else {
            response = `END Payment cancelled.`;
          }
        } else if (level === 5) {
          const receiptNo = 'RCP' + Date.now();
          response = `END Payment of KES ${session.data.paymentAmount} successful!\nReceipt No: ${receiptNo}\nNext due: ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}\n\nSMS receipt sent to ${phoneNumber}`;
        }
      }
      // CUSTOMER SUPPORT FLOW
      else if (textArray[0] === '6') {
        if (level === 1) {
          response = `CON Customer Support:\n1. Call Us: 0800 123 456\n2. Request Call Back\n3. FAQ\n4. Email: support@safecover.co.ke\n0. Back`;
        } else if (textArray[1] === '1') {
          response = `END Calling 0800 123 456...\nOur support team is available 24/7.`;
        } else if (textArray[1] === '2') {
          response = `END Call back request received!\nWe'll call ${phoneNumber} within 2 hours.`;
        } else if (textArray[1] === '3') {
          response = `CON FAQ:\n1. How to file a claim\n2. Payment methods\n3. Policy renewal\n4. Coverage details\n0. Back`;
        }
      }
      // CHECK BALANCE FLOW
      else if (textArray[0] === '7') {
        if (level === 1) {
          response = `CON Enter your 4-digit PIN:`;
        } else if (level === 2) {
          const pin = textArray[1];
          const user = Object.values(users).find(u => u.phoneNumber === phoneNumber && u.pin === pin);
          if (!user) {
            response = `END Incorrect PIN or not registered.`;
          } else {
            const userPolicies = policies[user.accountNumber] || [];
            const totalCoverage = userPolicies.reduce((sum, p) => sum + (p.cover || 0), 0);
            const pendingPremiums = userPolicies.reduce((sum, p) => sum + p.premium, 0);
            
            response = `END Account Summary:\nAccount: ${user.accountNumber}\nActive Policies: ${userPolicies.length}\nTotal Coverage: KES ${totalCoverage}\n\nPending Premiums: KES ${pendingPremiums}\nNext Due: ${userPolicies[0]?.nextDue || 'N/A'}\n\nDial ${serviceCode} for more options.`;
          }
        }
      }
      // EXIT
      else if (textArray[0] === '0') {
        response = `END Thank you for using SafeCover Insurance.\nFor support: 0800 123 456\nDial ${serviceCode} anytime.`;
      }
      // Default fallback
      else {
        response = `END Invalid selection.\nPlease dial ${serviceCode} again.`;
      }

      res.set('Content-Type', 'text/plain');
      res.send(response);
    } catch (error) {
      console.error('USSD Handler Error:', error);
      res.status(500).json({ error: 'Failed to process USSD request', message: error.message });
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
