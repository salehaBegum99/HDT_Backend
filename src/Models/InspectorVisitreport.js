const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const User = require('./User');
const Application = require('./Application');

const VisitReport = sequelize.define('VisitReport', {
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
  inspectorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  visitDate:       { type: DataTypes.DATEONLY, allowNull: false },
  comments:        { type: DataTypes.TEXT,     allowNull: false },
  isVerified:      { type: DataTypes.BOOLEAN,  defaultValue: true },
  rejectionReason: { type: DataTypes.TEXT,     allowNull: true },
  trancheNumber:   { type: DataTypes.INTEGER,  allowNull: true },
}, {
  tableName: 'visit_reports',
  timestamps: true,
});

VisitReport.belongsTo(Application, { foreignKey: 'applicationId' });
VisitReport.belongsTo(User,        { foreignKey: 'inspectorId', as: 'inspector' });

module.exports = VisitReport;