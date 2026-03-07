const express = require('express');
const DataService = require('../services/DataService');

const router = express.Router();

// Get all active plans
router.get('/', async (req, res) => {
  try {
    const plans = await DataService.getPlans();
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Fetch plans error:', error);
    res.status(500).json({ error: 'Failed to fetch insurance plans' });
  }
});

module.exports = router;
