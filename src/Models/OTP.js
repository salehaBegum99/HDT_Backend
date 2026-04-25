// Should look like this (Sequelize):
const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const OTP = sequelize.define('OTP', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  mobile:    { type: DataTypes.STRING, allowNull: false },
  otp:       { type: DataTypes.STRING(6), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  isUsed:    { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'otps',
  timestamps: true,
});

module.exports = OTP;