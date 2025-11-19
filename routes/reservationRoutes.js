const express = require('express');
const router = express.Router();
const reservationController = require('../controllers/reservationController');

// Create reservation
router.post('/', reservationController.createReservation);

// Read all reservations
router.get('/', reservationController.getReservations);

// Read one reservation
router.get('/:id', reservationController.getReservationById);

// Update reservation
router.put('/:id', reservationController.updateReservation);

// Delete reservation
router.delete('/:id', reservationController.deleteReservation);

module.exports = router;
