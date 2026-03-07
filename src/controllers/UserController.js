const DataService = require('../services/DataService');
const AuthMiddleware = require('../middleware/auth');
const bcrypt = require('bcryptjs');
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

            if (password) {
                updates.password = await bcrypt.hash(password, 10);
            }

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

            // Verify password
            if (user.password && password) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (!isMatch) {
                    return res.status(401).json({ error: 'Invalid credentials' });
                }
            } else if (password) {
                // If user has no password yet (registered via USSD but now logging in via Web)
                // We might want to handle this differently, but for now reject
                return res.status(401).json({ error: 'No password set for this account. Please register.' });
            }

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
            const userData = await DataService.getUserById(userId);

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
