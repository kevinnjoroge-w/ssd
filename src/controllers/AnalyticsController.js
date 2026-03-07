const User = require('../models/User');
const Payment = require('../models/Payment');
const Policy = require('../models/Policy');
const Plan = require('../models/Plan');

class AnalyticsController {
    /**
     * Get overall stats for admin dashboard
     */
    static async getStats(req, res) {
        try {
            // Basic stats
            const totalUsers = await User.query().resultSize();
            const totalPolicies = await Policy.query().resultSize();
            const activePolicies = await Policy.query().where('status', 'active').resultSize();

            const revenueData = await Payment.query()
                .where('status', 'completed')
                .sum('amount as totalRevenue')
                .first();

            const totalRevenue = parseFloat(revenueData.totalRevenue || 0);

            // Growth over last 30 days (simplified)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const newUsersLast30Days = await User.query()
                .where('created_at', '>=', thirtyDaysAgo.toISOString())
                .resultSize();

            // Plan distribution
            const planStats = await Plan.query()
                .select('name', 'coverage_type')
                .withGraphFetched('policies')
                .then(plans => {
                    return plans.map(p => ({
                        name: p.name,
                        coverage_type: p.coverage_type,
                        policyCount: p.policies ? p.policies.length : 0
                    }));
                });

            // Recent transactions
            const recentTransactions = await Payment.query()
                .withGraphFetched('user')
                .orderBy('created_at', 'desc')
                .limit(5);

            res.json({
                success: true,
                data: {
                    metrics: {
                        totalUsers,
                        totalPolicies,
                        activePolicies,
                        totalRevenue,
                        newUsersLast30Days
                    },
                    planStats,
                    recentTransactions
                }
            });
        } catch (error) {
            console.error('Analytics error:', error);
            res.status(500).json({ error: 'Failed to fetch analytics' });
        }
    }
}

module.exports = AnalyticsController;
