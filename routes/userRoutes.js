const express = require('express');
const router = express.Router();
const User = require('../models/Users');
const sequelize = require('../config/database');

console.log('userRoutes.js loaded - routes registered');

// READ all users
router.get('/', async (req, res) => {
  try {
    console.log('GET /api/users - fetching all users');
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    console.error('Error in GET /api/users:', err);
    res.status(500).json({ error: err.message });
  }
});

// READ single user by ID - must come after other specific routes
router.get('/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log('GET /api/users/:id - userId:', userId, 'Request URL:', req.url);
    
    // Validate userId is a number
    if (!userId || userId === 'undefined' || isNaN(userId)) {
      return res.status(400).json({ error: 'Valid user ID is required' });
    }
    
    const user = await User.findByPk(parseInt(userId), {
      attributes: { exclude: ['password'] } // Don't return password
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If user has a car_id, get car details
    let carInfo = null;
    if (user.car_id) {
      const [carResults] = await sequelize.query(
        'SELECT * FROM Cars WHERE car_id = ?',
        { replacements: [user.car_id] }
      );
      if (carResults.length > 0) {
        carInfo = carResults[0];
      }
    }
    
    res.json({ ...user.toJSON(), car: carInfo });
  } catch (err) {
    console.error('Error in GET /api/users/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

// UPDATE user
router.put('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const { fname, lname, email, phone, car_id } = req.body;
    
    // Don't allow updating password or role through this endpoint
    const updateData = {};
    if (fname !== undefined) updateData.fname = fname;
    if (lname !== undefined) updateData.lname = lname;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (car_id !== undefined) updateData.car_id = car_id === '' ? null : car_id;
    
    const [updated] = await User.update(updateData, {
      where: { user_id: userId },
      returning: true
    });
    
    if (updated === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get updated user (without password)
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    // Get car info if car_id exists
    let carInfo = null;
    if (updatedUser.car_id) {
      const [carResults] = await sequelize.query(
        'SELECT * FROM Cars WHERE car_id = ?',
        { replacements: [updatedUser.car_id] }
      );
      if (carResults.length > 0) {
        carInfo = carResults[0];
      }
    }
    
    res.json({ ...updatedUser.toJSON(), car: carInfo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE new user
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;