const express = require('express');
const PolicyController = require('../controllers/PolicyController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user's policies
router.get('/me', AuthMiddleware.verify, PolicyController.getMyPolicies);

// Create new policy
router.post('/', AuthMiddleware.verify, PolicyController.create);

module.exports = router;
