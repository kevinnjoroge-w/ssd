const express = require('express');
const USSDController = require('../controllers/USSDController');
const AfricasTalkingController = require('../controllers/AfricasTalkingController');

const router = express.Router();

// Standard USSD request handler (for testing)
router.post('/', USSDController.handleUSSD);

// Africa's Talking USSD callback endpoint
// This is where AT sends incoming USSD requests
router.post('/callback', AfricasTalkingController.handleATCallback);

// User registration
router.post('/register', USSDController.registerUser);

// Get all plans
router.get('/plans', USSDController.getPlans);

// Buy policy
router.post('/buy-policy', USSDController.buyPolicy);

// Get user policies
router.get('/policies/:userId', USSDController.getUserPolicies);

module.exports = router;
