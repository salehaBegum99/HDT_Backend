const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const User = require('./User');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  title:   { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT,   allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'STATUS_CHANGE','INSPECTOR_ASSIGNED',
      'DOCUMENT_REQUESTED','PAYMENT_DISBURSED','GENERAL'
    ),
    defaultValue: 'GENERAL',
  },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  link:   { type: DataTypes.STRING,  allowNull: true },
}, {
  tableName: 'notifications',
  timestamps: true,
});

Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = Notification;