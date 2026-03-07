const express = require('express');
const AnalyticsController = require('../controllers/AnalyticsController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Admin stats (Secured with isAdmin)
router.get('/stats', AuthMiddleware.verify, AuthMiddleware.isAdmin, AnalyticsController.getStats);

module.exports = router;
