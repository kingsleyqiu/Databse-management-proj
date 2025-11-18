const Station = require('../models/Station');

exports.createStation = async (req, res) => {
  try {
    const { name, operator, address, latitude, longitude, ports, status } = req.body;
    const station = await Station.create({ name, operator, address, latitude, longitude, ports, status });
    res.status(201).json({ message: 'Station created', station });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getStations = async (req, res) => {
  try {
    const stations = await Station.findAll();
    res.json(stations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getStationById = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });
    res.json(station);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateStation = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });

    const { name, operator, address, latitude, longitude, ports, status } = req.body;
    await station.update({ name, operator, address, latitude, longitude, ports, status });
    res.json({ message: 'Station updated', station });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStation = async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);
    if (!station) return res.status(404).json({ error: 'Station not found' });

    await station.destroy();
    res.json({ message: 'Station deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};