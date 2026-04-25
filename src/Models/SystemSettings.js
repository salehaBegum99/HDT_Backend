const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  defaultTotalTranches: {
    type: DataTypes.INTEGER,
    defaultValue: 3,
    allowNull: false,
  },
  maxScholarshipAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 100000.00,
    allowNull: false,
  },
  minScholarshipAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 10000.00,
    allowNull: false,
  },
  documentRetentionDays: {
    type: DataTypes.INTEGER,
    defaultValue: 365,
    allowNull: false,
  },
  applicationDeadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  updatedBy: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'system_settings',
  timestamps: true,
});

module.exports = SystemSettings;