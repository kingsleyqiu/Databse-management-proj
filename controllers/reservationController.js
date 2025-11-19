const Reservation = require('../models/Reservation');

exports.createReservation = async (req, res) => {
  try {
    const { user_id, charger_id, startt, endt, status } = req.body;
    const reservation = await Reservation.create({
      user_id,
      charger_id,
      startt,
      endt,
      status: status || 'Reserved'
    });
    res.status(201).json({ message: 'Reservation created', reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.findAll();
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });
    res.json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    const { user_id, charger_id, startt, endt, status } = req.body;
    await reservation.update({
      user_id,
      charger_id,
      startt,
      endt,
      status
    });
    res.json({ message: 'Reservation updated', reservation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) return res.status(404).json({ error: 'Reservation not found' });

    await reservation.destroy();
    res.json({ message: 'Reservation deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
