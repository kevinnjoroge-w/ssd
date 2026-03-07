const request = require('supertest');
const app = require('../src/server');
const AuthMiddleware = require('../src/middleware/auth');
const { v4: uuidv4 } = require('uuid');

describe('Security and Authorization Tests', () => {
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const adminId = uuidv4();

    const user1Token = AuthMiddleware.generateToken(userId1, 'user');
    const user2Token = AuthMiddleware.generateToken(userId2, 'user');
    const adminToken = AuthMiddleware.generateToken(adminId, 'admin');

    describe('Unauthenticated Access', () => {
        test('GET /api/ussd/policies/:userId - Should fail without token', async () => {
            const response = await request(app).get(`/api/ussd/policies/${userId1}`);
            expect(response.status).toBe(401);
            expect(response.body.error).toContain('No authorization token');
        });

        test('POST /api/payments/mpesa/initiate - Should fail without token', async () => {
            const response = await request(app)
                .post('/api/payments/mpesa/initiate')
                .send({ userId: userId1, amount: 100, phoneNumber: '0712345678' });
            expect(response.status).toBe(401);
        });

        test('GET /api/ussd/session/test-session - Should fail without token', async () => {
            const response = await request(app).get('/api/ussd/session/test-session');
            expect(response.status).toBe(401);
        });
    });

    describe('User Authorization (Ownership)', () => {
        test('GET /api/ussd/policies/:userId - Should allow access to own policies', async () => {
            // Note: This might return 200 even if no policies exist, as long as it passes middleware
            const response = await request(app)
                .get(`/api/ussd/policies/${userId1}`)
                .set('Authorization', `Bearer ${user1Token}`);

            // If the controller logic fails because the user isn't in DB, that's okay, 
            // we just want to ensure it passes the AuthMiddleware (not 403)
            expect(response.status).not.toBe(403);
            expect(response.status).not.toBe(401);
        });

        test('GET /api/ussd/policies/:userId - Should deny access to other user policies', async () => {
            const response = await request(app)
                .get(`/api/ussd/policies/${userId2}`) // Trying to access user2 data
                .set('Authorization', `Bearer ${user1Token}`); // With user1 token

            expect(response.status).toBe(403);
            expect(response.body.error).toContain('only access your own data');
        });

        test('POST /api/payments/mpesa/initiate - Should deny initiating payment for another user', async () => {
            const response = await request(app)
                .post('/api/payments/mpesa/initiate')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    userId: userId2, // Trying to pay for user2
                    amount: 100,
                    phoneNumber: '0712345678'
                });

            expect(response.status).toBe(403);
        });
    });

    describe('Admin Authorization', () => {
        test('GET /api/ussd/session/:sessionId - Should allow admin to access any session info', async () => {
            const response = await request(app)
                .get('/api/ussd/session/test-session-id')
                .set('Authorization', `Bearer ${adminToken}`);

            // Should not be 401/403. Might be 404 if session doesn't exist, which is fine.
            expect(response.status).not.toBe(403);
            expect(response.status).not.toBe(401);
        });

        test('GET /api/ussd/session/:sessionId - Should deny regular user from accessing session info', async () => {
            const response = await request(app)
                .get('/api/ussd/session/test-session-id')
                .set('Authorization', `Bearer ${user1Token}`);

            expect(response.status).toBe(403);
        });

        test('GET /api/analytics/stats - Should allow admin access', async () => {
            const response = await request(app)
                .get('/api/analytics/stats')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).not.toBe(403);
        });
    });
});
