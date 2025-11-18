const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/Users');

// Register
router.post('/register', async (req, res) => {
  try {
    const { fname, lname, email, password, phone, car_id } = req.body;
    const user = await User.create({ fname, lname, email, password, phone, car_id });
    res.json({ message: '✅ User registered successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid password' });

    req.session.user = { id: user.user_id, email: user.email, role: user.role };
    res.json({ message: '✅ Login successful', user: req.session.user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ message: '✅ Logged out successfully' });
  });
});

module.exports = router;

