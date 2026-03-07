const DataService = require('../services/DataService');

class PolicyController {
    /**
     * Create a new policy
     */
    static async create(req, res) {
        try {
            const { planId, premium, coverageAmount } = req.body;
            const userId = req.user.userId;

            if (!planId || !premium) {
                return res.status(400).json({ error: 'Plan ID and premium are required' });
            }

            const policy = await DataService.createPolicy(userId, planId, premium, coverageAmount);

            res.status(201).json({
                success: true,
                data: policy
            });
        } catch (error) {
            console.error('Create policy error:', error);
            res.status(500).json({ error: 'Failed to create insurance policy' });
        }
    }

    /**
     * Get user policies
     */
    static async getMyPolicies(req, res) {
        try {
            const userId = req.user.userId;
            const policies = await DataService.getUserActivePolicies(userId);

            res.json({
                success: true,
                data: policies
            });
        } catch (error) {
            console.error('Fetch policies error:', error);
            res.status(500).json({ error: 'Failed to fetch your policies' });
        }
    }
}

module.exports = PolicyController;
