const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/Users');

// Register
router.post('/register', async (req, res) => {
  try {
    const { fname, lname, email, password, phone, car_id } = req.body;
    const user = await User.create({ fname, lname, email, password, phone, car_id });
    res.json({ success: true, message: 'User registered successfully', user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: "Invalid password" });

    // Save to session
    req.session.user = {
      user_id: user.user_id,
      role: user.role,
      email: user.email
    };

    // Return user object 
    res.json({
      success: true,
      message: "Login successful",
      user: {
        user_id: user.user_id,
        role: user.role,
        email: user.email
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: "Logged out" });
  });
});

module.exports = router;
