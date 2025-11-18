const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// Create station
router.post('/', stationController.createStation);

// Read all stations
router.get('/', stationController.getStations);

// Read one station
router.get('/:id', stationController.getStationById);

// Update station
router.put('/:id', stationController.updateStation);

// Delete station
router.delete('/:id', stationController.deleteStation);

module.exports = router;