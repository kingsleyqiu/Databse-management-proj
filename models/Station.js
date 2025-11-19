const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Station = sequelize.define('Station', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  operator: { type: DataTypes.STRING(100), allowNull: true },
  address: { type: DataTypes.STRING(255), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(9,6), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(9,6), allowNull: false },
  ports: { type: DataTypes.INTEGER, defaultValue: 1 },
  status: {
    type: DataTypes.ENUM('Active', 'Maintenance', 'Offline'),
    defaultValue: 'Active'
  }
}, {
  tableName: 'Station', // exactly matches your DB table
  timestamps: false
});

module.exports = Station;