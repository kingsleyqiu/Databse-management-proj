const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

// Create session
router.post('/', sessionController.createSession);

// Read all sessions
router.get('/', sessionController.getSessions);

// Read one session
router.get('/:id', sessionController.getSessionById);

// Update session
router.put('/:id', sessionController.updateSession);

// Delete session
router.delete('/:id', sessionController.deleteSession);

module.exports = router;
