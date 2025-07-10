const express = require('express');
const router = express.Router();

// Content routes placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Content routes' });
});

module.exports = router;