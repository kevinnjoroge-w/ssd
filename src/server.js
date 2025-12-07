require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Import routes
const ussdRoutes = require('./routes/ussd');
const paymentRoutes = require('./routes/payments');
const userRoutes = require('./routes/users');
const planRoutes = require('./routes/plans');
const AfricasTalkingController = require('./controllers/AfricasTalkingController');

// Initialize Express app
const app = express();

// Security Middleware
app.use(helmet());
app.use(cors());

// Logging Middleware
app.use(morgan('combined'));

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check Route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/ussd', ussdRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/plans', planRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'USSD Insurance App API',
    version: '1.0.0',
    documentation: '/api/docs'
  });
});

// Africa's Talking USSD Test Endpoint (for development)
// Simulate an AT USSD request
app.post('/api/ussd/test/simulate', AfricasTalkingController.simulateUSSDRequest);

// Get session details (for debugging)
app.get('/api/ussd/session/:sessionId', AfricasTalkingController.getSessionDetails);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle server errors (e.g. port already in use)
server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`✗ Port ${PORT} is already in use.`);
    console.error('Tip: On Windows run `netstat -ano | findstr :' + PORT + '` to find the PID, then `taskkill /PID <pid> /F` to free the port.');
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

module.exports = app;
