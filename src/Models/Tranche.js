const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const User = require('./User');
const Application = require('./Application');

const Tranche = sequelize.define('Tranche', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  applicationId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'applications', key: 'id' },
  },
  supervisorId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  trancheNumber:        { type: DataTypes.INTEGER },
  amount:               { type: DataTypes.DECIMAL(10,2) },
  disbursedDate:        { type: DataTypes.DATEONLY, allowNull: true },
  paymentEvidence:      { type: DataTypes.STRING,  allowNull: true },
  transactionReference: { type: DataTypes.STRING,  allowNull: true },
  status: {
    type: DataTypes.ENUM('PENDING','DISBURSED','ON_HOLD'),
    defaultValue: 'PENDING',
  },
  comments:   { type: DataTypes.TEXT,    allowNull: true },
  isFlagged:  { type: DataTypes.BOOLEAN, defaultValue: false },
  flagReason: { type: DataTypes.TEXT,    allowNull: true },
}, {
  tableName: 'tranches',
  timestamps: true,
});

Tranche.belongsTo(Application, { foreignKey: 'applicationId' });
Tranche.belongsTo(User, { foreignKey: 'supervisorId', as: 'supervisor' });

module.exports = Tranche;