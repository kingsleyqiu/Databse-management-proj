const ChargingSession = require('../models/ChargingSession');

exports.createSession = async (req, res) => {
  try {
    const { user_id, charger_id, res_id, startt, endt, energy_delivered_kwh, cost, payment_stat } = req.body;
    const session = await ChargingSession.create({
      user_id,
      charger_id,
      res_id: res_id || null,
      startt,
      endt,
      energy_delivered_kwh,
      cost,
      payment_stat: payment_stat || 'Pending'
    });
    res.status(201).json({ message: 'Charging session created', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSessions = async (req, res) => {
  try {
    const sessions = await ChargingSession.findAll();
    res.json(sessions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const session = await ChargingSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateSession = async (req, res) => {
  try {
    const session = await ChargingSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const { user_id, charger_id, res_id, startt, endt, energy_delivered_kwh, cost, payment_stat } = req.body;
    await session.update({
      user_id,
      charger_id,
      res_id: res_id || null,
      startt,
      endt,
      energy_delivered_kwh,
      cost,
      payment_stat
    });
    res.json({ message: 'Session updated', session });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSession = async (req, res) => {
  try {
    const session = await ChargingSession.findByPk(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await session.destroy();
    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
