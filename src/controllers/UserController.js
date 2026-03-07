const DataService = require('../services/DataService');
const AuthMiddleware = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

class UserController {
    /**
     * Register a new user (Web)
     */
    static async register(req, res) {
        try {
            const { phone, name, email, occupation, income_range, preferred_language, password } = req.body;

            if (!phone || !name) {
                return res.status(400).json({ error: 'Phone and name are required' });
            }

            // Check if user exists
            let user = await DataService.getOrCreateUser(phone, name);

            // Update with additional fields if provided (for web registration)
            const updates = {};
            if (email) updates.email = email;
            if (occupation) updates.occupation = occupation;
            if (income_range) updates.income_range = income_range;
            if (preferred_language) updates.preferred_language = preferred_language;
            // Note: In a real app we'd handle password hashing here

            if (Object.keys(updates).length > 0) {
                user = await DataService.updateUserProfile(user.id, updates);
            }

            const token = AuthMiddleware.generateToken(user.id);

            res.status(201).json({
                success: true,
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            console.error('User registration error:', error);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }

    /**
     * Login user (Web)
     */
    static async login(req, res) {
        try {
            const { phone, password } = req.body;

            if (!phone) {
                return res.status(400).json({ error: 'Phone is required' });
            }

            const user = await DataService.getOrCreateUser(phone);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // In a real app, verify password here

            const token = AuthMiddleware.generateToken(user.id);

            res.json({
                success: true,
                data: {
                    user,
                    token
                }
            });
        } catch (error) {
            console.error('User login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    }

    /**
     * Get current user profile
     */
    static async getMe(req, res) {
        try {
            const { userId } = req.user;
            const user = await DataService.getOrCreateUser(null, null); // This is a bit hacky, let's add a findById to DataService

            // I'll need to add a findById method to DataService or use Objection directly
            const User = require('../models/User');
            const userData = await User.query().findById(userId).withGraphFetched('[policies.plan, payments]');

            if (!userData) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({
                success: true,
                data: userData
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }
}

module.exports = UserController;
