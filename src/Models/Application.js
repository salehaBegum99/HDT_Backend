const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const User = require('./User');

const Application = sequelize.define('Application', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  applicantId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  candidateId:          { type: DataTypes.STRING, allowNull: false },
  applicationDisplayId: { type: DataTypes.STRING, unique: true, allowNull: true },

  status: {
    type: DataTypes.ENUM('SUBMITTED','ASSIGNED','INSPECTED','APPROVED','REJECTED','DISBURSED'),
    defaultValue: 'SUBMITTED',
  },

  // Personal (stored as JSONB — PostgreSQL specific, very powerful)
  personal:   { type: DataTypes.JSONB, allowNull: true },
  family:     { type: DataTypes.JSONB, allowNull: true },
  academic:   { type: DataTypes.JSONB, allowNull: true },
  background: { type: DataTypes.JSONB, allowNull: true },
  reason:     { type: DataTypes.JSONB, allowNull: true },
  bank:       { type: DataTypes.JSONB, allowNull: true },
  documents:  { type: DataTypes.JSONB, allowNull: true },

  assignedInspector:  {
    type: DataTypes.UUID, allowNull: true,
    references: { model: 'users', key: 'id' },
  },
  assignedSupervisor: {
    type: DataTypes.UUID, allowNull: true,
    references: { model: 'users', key: 'id' },
  },

  hoNotes:          { type: DataTypes.TEXT,    allowNull: true },
  rejectionReason:  { type: DataTypes.TEXT,    allowNull: true },
  isFlagged:        { type: DataTypes.BOOLEAN, defaultValue: false },
  supervisorComments: { type: DataTypes.TEXT,  allowNull: true },
  approvedAmount:   { type: DataTypes.DECIMAL(10,2), allowNull: true },
  totalTranches:    { type: DataTypes.INTEGER, defaultValue: 1 },
  currentTranche:   { type: DataTypes.INTEGER, defaultValue: 0 },
  followUpRequested:{ type: DataTypes.BOOLEAN, defaultValue: false },
  documentRequest:  { type: DataTypes.JSONB,   allowNull: true },
  submittedAt:      { type: DataTypes.DATE,    defaultValue: DataTypes.NOW },
}, {
  tableName: 'applications',
  timestamps: true,
});

// Associations
Application.belongsTo(User, { foreignKey: 'applicantId',        as: 'applicant' });
Application.belongsTo(User, { foreignKey: 'assignedInspector',  as: 'inspector' });
Application.belongsTo(User, { foreignKey: 'assignedSupervisor', as: 'supervisor' });

module.exports = Application;