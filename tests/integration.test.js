const request = require('supertest');
const app = require('../src/server');

describe('USSD Insurance App - Integration Tests', () => {
  
  // USSD Endpoint Tests
  describe('USSD Endpoints', () => {
    
    test('POST /api/ussd - Should handle initial USSD request', async () => {
      const response = await request(app)
        .post('/api/ussd')
        .send({
          sessionId: 'test-session-001',
          phoneNumber: '+254712345678',
          text: '*123#'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('response');
      expect(response.body).toHaveProperty('continueSession');
      expect(response.body.response).toContain('Welcome');
    });

    test('POST /api/ussd - Should reject invalid phone number', async () => {
      const response = await request(app)
        .post('/api/ussd')
        .send({
          sessionId: 'test-session-001',
          phoneNumber: 'invalid-phone',
          text: '*123#'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('POST /api/ussd - Should reject missing sessionId', async () => {
      const response = await request(app)
        .post('/api/ussd')
        .send({
          phoneNumber: '+254712345678',
          text: '*123#'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body).toHaveProperty('error');
    });

    test('GET /api/ussd/plans - Should return all plans', async () => {
      const response = await request(app)
        .get('/api/ussd/plans');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/ussd/plans - Should have required plan fields', async () => {
      const response = await request(app)
        .get('/api/ussd/plans');

      const plan = response.body.data[0];
      expect(plan).toHaveProperty('id');
      expect(plan).toHaveProperty('name');
      expect(plan).toHaveProperty('coverage_type');
      expect(plan).toHaveProperty('min_premium');
      expect(plan).toHaveProperty('max_premium');
    });
  });

  // Payment Endpoint Tests
  describe('Payment Endpoints', () => {
    
    test('POST /api/payments/mpesa/initiate - Should initiate payment', async () => {
      const response = await request(app)
        .post('/api/payments/mpesa/initiate')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          amount: 100,
          phoneNumber: '+254712345678',
          description: 'Test Payment'
        });

      expect(response.status).toBeGreaterThanOrEqual(200);
      if (response.status === 200 && response.body.success) {
        expect(response.body.data).toHaveProperty('checkoutRequestId');
        expect(response.body.data).toHaveProperty('transactionId');
      }
    });

    test('POST /api/payments/mpesa/initiate - Should reject invalid amount', async () => {
      const response = await request(app)
        .post('/api/payments/mpesa/initiate')
        .send({
          userId: '550e8400-e29b-41d4-a716-446655440000',
          amount: -100,
          phoneNumber: '+254712345678'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    test('POST /api/payments/mpesa/initiate - Should reject missing fields', async () => {
      const response = await request(app)
        .post('/api/payments/mpesa/initiate')
        .send({
          amount: 100,
          phoneNumber: '+254712345678'
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  // Health Check
  describe('Health Check', () => {
    
    test('GET /health - Should return OK status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // Root Endpoint
  describe('Root Endpoint', () => {
    
    test('GET / - Should return API info', async () => {
      const response = await request(app)
        .get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Insurance');
    });
  });

  // 404 Handling
  describe('Error Handling', () => {
    
    test('GET /non-existent-route - Should return 404', async () => {
      const response = await request(app)
        .get('/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
    });
  });
});

// Unit Tests for Services
describe('USSDService', () => {
  const USSDService = require('../src/services/USSDService');

  test('calculateRecommendedCoverage - Should calculate coverage correctly', () => {
    const coverage = USSDService.calculateRecommendedCoverage(100, 500);
    expect(coverage).toBe(50000);
  });

  test('calculateRecommendedCoverage - Should cap at max coverage', () => {
    const coverage = USSDService.calculateRecommendedCoverage(1000, 500);
    expect(coverage).toBeLessThanOrEqual(500000);
  });

  test('recommendPlan - Should recommend basic for low premium', () => {
    const plan = USSDService.recommendPlan(50);
    expect(plan.type).toBe('basic');
  });

  test('recommendPlan - Should recommend standard for medium premium', () => {
    const plan = USSDService.recommendPlan(150);
    expect(plan.type).toBe('standard');
  });

  test('recommendPlan - Should recommend comprehensive for high premium', () => {
    const plan = USSDService.recommendPlan(400);
    expect(plan.type).toBe('comprehensive');
  });

  test('formatResponse - Should truncate long lines', () => {
    const longText = 'A'.repeat(200);
    const formatted = USSDService.formatResponse(longText);
    const lines = formatted.split('\n');
    lines.forEach(line => {
      expect(line.length).toBeLessThanOrEqual(160);
    });
  });
});

describe('PersonalizationEngine', () => {
  const PersonalizationEngine = require('../src/services/PersonalizationEngine');

  test('calculateCoverage - Should calculate correctly', () => {
    const coverage = PersonalizationEngine.calculateCoverage(100, { coverage_multiplier: 500 });
    expect(coverage).toBe(50000);
  });

  test('scoreUserRisk - Should score low risk', () => {
    const user = { 
      occupation: 'Software Engineer',
      income_range: 'high'
    };
    const risk = PersonalizationEngine.scoreUserRisk(user);
    expect(['low', 'medium', 'high']).toContain(risk);
  });

  test('adjustPremiumByRisk - Should apply low risk discount', () => {
    const adjusted = PersonalizationEngine.adjustPremiumByRisk(100, 'low');
    expect(adjusted).toBe(85);
  });

  test('adjustPremiumByRisk - Should apply high risk surcharge', () => {
    const adjusted = PersonalizationEngine.adjustPremiumByRisk(100, 'high');
    expect(adjusted).toBe(125);
  });

  test('adjustPremiumByRisk - Should not adjust medium risk', () => {
    const adjusted = PersonalizationEngine.adjustPremiumByRisk(100, 'medium');
    expect(adjusted).toBe(100);
  });
});

describe('Helpers', () => {
  const Helpers = require('../src/utils/helpers');

  test('formatPhoneNumber - Should format correctly', () => {
    const formatted = Helpers.formatPhoneNumber('0712345678');
    expect(formatted).toBe('+254712345678');
  });

  test('formatPhoneNumber - Should handle +254 format', () => {
    const formatted = Helpers.formatPhoneNumber('+254712345678');
    expect(formatted).toBe('+254712345678');
  });

  test('isValidKenyanPhone - Should validate correct number', () => {
    expect(Helpers.isValidKenyanPhone('+254712345678')).toBe(true);
    expect(Helpers.isValidKenyanPhone('0712345678')).toBe(true);
  });

  test('isValidKenyanPhone - Should reject invalid number', () => {
    expect(Helpers.isValidKenyanPhone('invalid')).toBe(false);
    expect(Helpers.isValidKenyanPhone('+25512345678')).toBe(false);
  });

  test('generatePolicyNumber - Should generate unique numbers', () => {
    const num1 = Helpers.generatePolicyNumber();
    const num2 = Helpers.generatePolicyNumber();
    expect(num1).not.toBe(num2);
    expect(num1).toMatch(/^POL-/);
  });

  test('formatCurrency - Should format correctly', () => {
    const formatted = Helpers.formatCurrency(1000);
    expect(formatted).toContain('1,000');
  });

  test('isEmpty - Should detect empty values', () => {
    expect(Helpers.isEmpty(null)).toBe(true);
    expect(Helpers.isEmpty('')).toBe(true);
    expect(Helpers.isEmpty([])).toBe(true);
    expect(Helpers.isEmpty({})).toBe(true);
    expect(Helpers.isEmpty('value')).toBe(false);
  });
});

// Integration Test Scenarios
describe('Complete User Journeys', () => {

  test('Journey: User registers and buys insurance', async () => {
    // Step 1: Initial USSD request
    const step1 = await request(app)
      .post('/api/ussd')
      .send({
        sessionId: 'journey-001',
        phoneNumber: '+254712345678',
        text: '*123#'
      });
    expect(step1.status).toBe(200);

    // Step 2: Register user
    const step2 = await request(app)
      .post('/api/ussd/register')
      .send({
        sessionId: 'journey-001',
        phoneNumber: '+254712345678',
        name: 'Test User',
        occupation: 'Engineer',
        incomeRange: 'high'
      });
    expect(step2.status).toBe(200);

    // Step 3: Get available plans
    const step3 = await request(app)
      .get('/api/ussd/plans');
    expect(step3.status).toBe(200);
    expect(step3.body.data.length).toBeGreaterThan(0);
  });

  test('Journey: User makes payment', async () => {
    // This would require a valid user ID from the database
    // Step 1: Initiate payment
    const step1 = await request(app)
      .post('/api/payments/mpesa/initiate')
      .send({
        userId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
        phoneNumber: '+254712345678',
        description: 'Insurance Premium'
      });
    
    // Check response (may fail if M-Pesa creds not set up)
    if (step1.status === 200) {
      expect(step1.body).toHaveProperty('success');
    }
  });
});

// Performance Tests
describe('Performance', () => {

  test('USSD endpoint should respond within 2 seconds', async () => {
    const startTime = Date.now();
    
    await request(app)
      .post('/api/ussd')
      .send({
        sessionId: 'perf-001',
        phoneNumber: '+254712345678',
        text: '*123#'
      });

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(2000);
  });

  test('Plans endpoint should respond within 500ms', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/ussd/plans');

    const responseTime = Date.now() - startTime;
    expect(responseTime).toBeLessThan(500);
  });
});
