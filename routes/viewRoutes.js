const express = require("express");
const router = express.Router();
const sequelize = require("../config/database");

const views = {
  "session-details": "SELECT * FROM v_session_details",
  "max-avg-rate": "SELECT * FROM v_operators_max_avg_rate",
  "reservations-session": "SELECT * FROM v_reservations_with_session",
  "pricing-full": "SELECT * FROM v_station_pricing_full",
  "resources": "SELECT * FROM v_available_resources",
  "station-util": "SELECT * FROM v_station_utilization",
  "user-total-paid": "SELECT * FROM v_user_total_paid",
  "future-res-details": "SELECT * FROM v_future_reservations_detail",
  "charger-status": "SELECT * FROM v_charger_status_summary",
  "session-cost-rate": "SELECT * FROM v_session_cost_vs_rate",
  "user-compatible": "SELECT * FROM v_user_compatible_chargers",
  "vacancy": "SELECT * FROM v_station_vacancy",
  "next-available": "SELECT * FROM v_next_available_per_station",
  "reliability": "SELECT * FROM v_station_reliability"
};

router.get("/:view", async (req, res) => {
  const sql = views[req.params.view];
  if (!sql) return res.status(404).json({ error: "View not found" });

  try {
    const [rows] = await sequelize.query(sql);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
