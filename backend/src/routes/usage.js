const express = require('express');
const router = express.Router();

// Usage routes placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Usage routes' });
});

module.exports = router;