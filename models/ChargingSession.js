const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChargingSession = sequelize.define('ChargingSession', {
  session_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  charger_id: { type: DataTypes.INTEGER, allowNull: false },
  res_id: { type: DataTypes.INTEGER, allowNull: true },
  startt: { type: DataTypes.DATE, allowNull: false },
  endt: { type: DataTypes.DATE, allowNull: false },
  energy_delivered_kwh: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
  cost: { type: DataTypes.DECIMAL(8, 2), allowNull: false },
  payment_stat: {
    type: DataTypes.ENUM('Pending', 'Paid', 'Failed'),
    defaultValue: 'Pending'
  }
}, {
  tableName: 'ChargingSession',
  timestamps: false
});

module.exports = ChargingSession;
