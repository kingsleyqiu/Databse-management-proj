const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Reservation = sequelize.define('Reservation', {
  res_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  charger_id: { type: DataTypes.INTEGER, allowNull: false },
  startt: { type: DataTypes.DATE, allowNull: false },
  endt: { type: DataTypes.DATE, allowNull: false },
  status: {
    type: DataTypes.ENUM('Reserved', 'Cancelled', 'Completed', 'Expired'),
    defaultValue: 'Reserved'
  }
}, {
  tableName: 'Reservation',
  timestamps: false
});

module.exports = Reservation;
