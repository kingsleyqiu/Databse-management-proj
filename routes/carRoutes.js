const express = require('express');
const router = express.Router();
const sequelize = require('../config/database');

// READ all cars
router.get('/', async (req, res) => {
  try {
    const [cars] = await sequelize.query('SELECT * FROM Cars ORDER BY make, model');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

