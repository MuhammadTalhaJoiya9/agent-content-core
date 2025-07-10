const express = require('express');
const router = express.Router();

// Projects routes placeholder
router.get('/', (req, res) => {
  res.json({ message: 'Projects routes' });
});

module.exports = router;