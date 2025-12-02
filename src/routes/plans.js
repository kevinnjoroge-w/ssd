const express = require('express');

const router = express.Router();

// Placeholder plan routes
router.get('/', async (req, res) => {
  res.json({
    message: 'Plans endpoint'
  });
});

module.exports = router;
