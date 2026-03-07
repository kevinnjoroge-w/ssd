const request = require('supertest');
const app = require('../src/server');
const Plan = require('../src/models/Plan');
const Policy = require('../src/models/Policy');
const User = require('../src/models/User');
const { v4: uuidv4 } = require('uuid');

describe('USSD PIN-based Authentication Flow', () => {
    const phoneNumber = '+254712345678';
    const pin = '1234';
    const userName = 'Test User';
    let userId;

    beforeAll(async () => {
        // Cleanup
        await Policy.query().delete();
        await Plan.query().delete();
        await User.query().delete().where('phone', phoneNumber);

        // Create test plan
        const plan = await Plan.query().insert({
            id: uuidv4(),
            name: 'Basic Health',
            coverage_type: 'health',
            min_premium: 1000,
            max_premium: 10000,
            max_coverage: 5000000,
            coverage_multiplier: 500
        });

        // Create test user
        const user = await User.query().insert({
            id: uuidv4(),
            phone: phoneNumber,
            name: userName,
            pin: pin
        });
        userId = user.id;

        // Create test policy
        await Policy.query().insert({
            id: uuidv4(),
            user_id: userId,
            plan_id: plan.id,
            policy_number: 'POL123456',
            premium: 1500,
            coverage_amount: 750000,
            status: 'active',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
    });

    afterAll(async () => {
        await User.query().delete().where('phone', phoneNumber);
    });

    test('Registered user dial should prompt for PIN', async () => {
        const sessionId = 'test-session-' + Date.now();
        const response = await request(app)
            .post('/api/ussd')
            .send({
                sessionId,
                phoneNumber,
                text: ''
            });

        expect(response.status).toBe(200);
        expect(response.text).toContain(`Welcome back, ${userName}`);
        expect(response.text).toContain('Please enter your 4-digit PIN:');
    });

    test('Correct PIN should show authenticated main menu', async () => {
        const sessionId = 'test-session-' + Date.now();

        // 1. Initial dial
        await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '' });

        // 2. Enter PIN
        const response = await request(app)
            .post('/api/ussd')
            .send({
                sessionId,
                phoneNumber,
                text: pin
            });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Success! Select an option:');
        expect(response.text).toContain('1. Buy Insurance');
        expect(response.text).toContain('2. My Policies');
    });

    test('Incorrect PIN should fail', async () => {
        const sessionId = 'test-session-' + Date.now();

        // 1. Initial dial
        await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '' });

        // 2. Enter wrong PIN
        const response = await request(app)
            .post('/api/ussd')
            .send({
                sessionId,
                phoneNumber,
                text: '9999'
            });

        expect(response.status).toBe(200);
        expect(response.text).toContain('END Invalid PIN');
    });

    test('New user should see regular main menu', async () => {
        const newPhoneNumber = '+254799999999';
        const sessionId = 'new-session-' + Date.now();

        const response = await request(app)
            .post('/api/ussd')
            .send({
                sessionId,
                phoneNumber: newPhoneNumber,
                text: ''
            });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Welcome to SafeCover Insurance');
        expect(response.text).toContain('1. Register');
    });

    test('Authenticated user should skip PIN in sub-flows (Buy Insurance)', async () => {
        const sessionId = 'test-session-buy-' + Date.now();

        // 1. Initial dial
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '' });
        // 2. Enter PIN -> Should see Success Menu
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: pin });

        // 3. Select '1' (Buy Insurance) from Auth Menu (text is pin*1)
        const response = await request(app)
            .post('/api/ussd')
            .send({
                sessionId,
                phoneNumber,
                text: `${pin}*1`
            });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Select Insurance Type:');
        expect(response.text).not.toContain('Enter your 4-digit PIN:');
    });

    test('Authenticated user should skip PIN in sub-flows (My Policies)', async () => {
        const sessionId = 'test-session-policies-' + Date.now();

        // 1. Initial dial
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: '' });
        // 2. Enter PIN
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber, text: pin });

        // 3. Select '2' (My Policies)
        const response = await request(app)
            .post('/api/ussd')
            .send({
                sessionId,
                phoneNumber,
                text: `${pin}*2`
            });

        expect(response.status).toBe(200);
        expect(response.text).toContain('Your Active Policies:');
        expect(response.text).not.toContain('Enter your 4-digit PIN:');
    });
});
