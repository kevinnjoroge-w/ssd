const express = require('express');
const USSDController = require('../controllers/USSDController');

const router = express.Router();

// USSD request handler
router.post('/', USSDController.handleUSSD);

// User registration
router.post('/register', USSDController.registerUser);

// Get all plans
router.get('/plans', USSDController.getPlans);

// Buy policy
router.post('/buy-policy', USSDController.buyPolicy);

// Get user policies
router.get('/policies/:userId', USSDController.getUserPolicies);

module.exports = router;
