const express = require('express');
const USSDController = require('../controllers/USSDController');
const AfricasTalkingController = require('../controllers/AfricasTalkingController');
const AuthMiddleware = require('../middleware/auth');
const ValidationMiddleware = require('../middleware/validation');

const router = express.Router();

// Standard USSD request handler (for testing)
router.post('/', ValidationMiddleware.validateUSSDRequest, USSDController.handleUSSD);

// Africa's Talking USSD callback endpoint
// This is where AT sends incoming USSD requests
router.post('/callback', AfricasTalkingController.handleATCallback);

// User registration
router.post('/register', USSDController.registerUser);

// Get all plans
router.get('/plans', USSDController.getPlans);

// Buy policy
router.post('/buy-policy', AuthMiddleware.verify, ValidationMiddleware.validatePolicyCreation, AuthMiddleware.authorizeUser, USSDController.buyPolicy);

// Get user policies
router.get('/policies/:userId', AuthMiddleware.verify, AuthMiddleware.authorizeUser, USSDController.getUserPolicies);

module.exports = router;
