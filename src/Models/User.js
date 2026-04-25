const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true,
  },
  mobile: {
    type: DataTypes.STRING(10),
    unique: true,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('APPLICANT','INSPECTOR','SUPERVISOR','HO','SUPERADMIN'),
    allowNull: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  isMobileVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isFirstLogin: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assignedArea: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sponsorOrg: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;