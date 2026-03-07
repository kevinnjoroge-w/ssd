const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');
const Session = require('../src/models/Session');
const { v4: uuidv4 } = require('uuid');

describe('USSD Registration Flow', () => {
    const phoneNumber = '+254700000001';
    const idNumber = '12345678';
    const fullName = 'New USSD User';
    const dob = '01/01/1990';
    const pin = '4321';

    beforeAll(async () => {
        await User.query().delete().where('phone', phoneNumber);
        await Session.query().delete().where('phone', phoneNumber);
    });

    test('Full registration flow with PIN confirmation', async () => {
        const sessionId = 'reg-session-' + Date.now();

        // 1. Initial dial
        let response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '' });
        expect(response.text).toContain('1. Register');

        // 2. Select Register
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1' });
        expect(response.text).toContain('1. New Customer');

        // 3. Select New Customer
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1*1' });
        expect(response.text).toContain('Enter your National ID number');

        // 4. Enter ID
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1*1*' + idNumber });
        expect(response.text).toContain('Enter your full name');

        // 5. Enter Name
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1*1*' + idNumber + '*' + fullName });
        expect(response.text).toContain('Enter date of birth');

        // 6. Enter DOB
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1*1*' + idNumber + '*' + fullName + '*' + dob });
        expect(response.text).toContain('Create a 4-digit PIN');

        // 7. Create PIN
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1*1*' + idNumber + '*' + fullName + '*' + dob + '*' + pin });
        expect(response.text).toContain('Confirm your 4-digit PIN');

        // 8. Confirm PIN (Success)
        response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber, text: '1*1*' + idNumber + '*' + fullName + '*' + dob + '*' + pin + '*' + pin });
        expect(response.text).toContain('Registration successful');

        // Verify user in DB
        const user = await User.query().findOne({ phone: phoneNumber });
        expect(user).toBeDefined();
        expect(user.name).toBe(fullName);
        expect(user.pin).toBe(pin);
    });

    test('Registration flow with PIN mismatch', async () => {
        const sessionId = 'reg-fail-session-' + Date.now();
        const phoneFail = '+254700000002';

        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '1' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '1*1' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '1*1*' + idNumber });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '1*1*' + idNumber + '*' + fullName });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '1*1*' + idNumber + '*' + fullName + '*' + dob });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneFail, text: '1*1*' + idNumber + '*' + fullName + '*' + dob + '*' + pin });

        // Confirm PIN (Mismatch)
        const response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber: phoneFail, text: '1*1*' + idNumber + '*' + fullName + '*' + dob + '*' + pin + '*9999' });

        expect(response.text).toContain('PIN mismatch');
    });

    test('Registration flow with leading asterisk', async () => {
        const sessionId = 'reg-leading-session-' + Date.now();
        const phoneLeading = '+254700000003';

        // Some gateways send the code as well, or a leading asterisk
        const response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber: phoneLeading, text: '*1' });

        expect(response.text).toContain('Select user type');
    });

    test('Registration flow with whitespace PIN', async () => {
        const sessionId = 'reg-space-session-' + Date.now();
        const phoneSpace = '+254700000004';
        const pinWithSpace = ' 1234 ';

        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '1' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '1*1' });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '1*1*' + idNumber });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '1*1*' + idNumber + '*' + fullName });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '1*1*' + idNumber + '*' + fullName + '*' + dob });
        await request(app).post('/api/ussd').send({ sessionId, phoneNumber: phoneSpace, text: '1*1*' + idNumber + '*' + fullName + '*' + dob + '*' + pinWithSpace });

        // Confirm PIN with space
        const response = await request(app)
            .post('/api/ussd')
            .send({ sessionId, phoneNumber: phoneSpace, text: '1*1*' + idNumber + '*' + fullName + '*' + dob + '*' + pinWithSpace + '*' + pinWithSpace });

        expect(response.text).toContain('Registration successful');

        const user = await User.query().findOne({ phone: phoneSpace });
        expect(user.pin).toBe('1234'); // Should be trimmed
    });
});
