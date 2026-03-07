const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const Plan = require('../src/models/Plan');
const Policy = require('../src/models/Policy');
const Payment = require('../src/models/Payment');
const FlutterwaveService = require('../src/services/FlutterwaveService');

// Mock FlutterwaveService
jest.mock('../src/services/FlutterwaveService');

describe('USSD Flutterwave Payment Flow', () => {
    const phoneNumber = '+254711111111';
    let user;
    let plan;
    let policy;

    beforeAll(async () => {
        // Setup data
        await User.query().delete();
        await Plan.query().delete();
        await Policy.query().delete();
        await Payment.query().delete();
        await Session.query().delete();

        user = await User.query().insert({
            id: 'user-1',
            phone: phoneNumber,
            name: 'Payment Test User',
            pin: '1234',
            role: 'customer'
        });

        plan = await Plan.query().insert({
            id: 'plan-1',
            name: 'Life Insurance',
            coverage_type: 'comprehensive',
            min_premium: 500,
            max_premium: 5000,
            max_coverage: 1000000,
            coverage_multiplier: 100
        });

        policy = await Policy.query().insert({
            id: 'policy-1',
            user_id: user.id,
            plan_id: plan.id,
            policy_number: 'POL-123',
            premium: 1000,
            coverage_amount: 100000,
            status: 'active'
        });
    });

    test('Initiate payment for a policy via USSD', async () => {
        const sessionId = 'pay-session-' + Date.now();

        // Mock Flutterwave successful response
        FlutterwaveService.initiateMobileMoneyPayment.mockResolvedValue({
            success: true,
            message: 'Charge initiated',
            flwRef: 'FLW-TEST-123'
        });

        // 1. Initial dial -> PIN prompt
        let resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '' });
        expect(resp.text).toContain('enter your 4-digit PIN');

        // 2. Enter PIN -> Auth Main Menu
        resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234' });
        expect(resp.text).toContain('Select an option');

        // 3. Select Pay Premium (Option 4 in Auth Menu)
        resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4' });
        expect(resp.text).toContain('Outstanding Premiums');

        // 4. Select the first policy (Option 1)
        resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4*1' });
        expect(resp.text).toContain('Pay KES 1000');

        // 5. Confirm & Pay (Option 1)
        resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4*1*1' });
        expect(resp.text).toContain('Select payment method');

        // 6. Select M-PESA (Option 1)
        resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4*1*1*1' });
        expect(resp.text).toContain('Payment of KES 1000 initiated');
        expect(resp.text).toContain('STK push');

        // Verify FlutterwaveService was called
        expect(FlutterwaveService.initiateMobileMoneyPayment).toHaveBeenCalledWith(
            phoneNumber,
            1000,
            expect.any(String),
            expect.any(String),
            'Payment Test User'
        );

        // Verify payment record in DB
        const payment = await Payment.query().where('user_id', user.id).first();
        expect(payment).toBeDefined();
        expect(payment.status).toBe('pending');
        expect(payment.flw_ref).toBe('FLW-TEST-123');
    });

    test('Handle payment initiation failure in USSD', async () => {
        const sessionId = 'pay-fail-session-' + Date.now();

        // Mock Flutterwave failure response
        FlutterwaveService.initiateMobileMoneyPayment.mockResolvedValue({
            success: false,
            message: 'Insufficient funds'
        });

        // Skip to selection step (using state from previous test or direct dial simulation)
        // Since it's a new sessionId, it starts from top. We use the global transform if authenticated.
        // But we didn't authenticate this session yet.

        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4*1' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4*1*1' });

        const resp = await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '1234*4*1*1*1' });

        expect(resp.text).toContain('Payment initiation failed');
        expect(resp.text).toContain('Insufficient funds');
    });
});
