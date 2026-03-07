const express = require('express');
const UserController = require('../controllers/UserController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Registration and Login
router.post('/register', UserController.register);
router.post('/login', UserController.login);

// Profile
router.get('/me', AuthMiddleware.verify, UserController.getMe);

module.exports = router;
