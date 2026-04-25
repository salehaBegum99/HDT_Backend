const { DataTypes } = require('sequelize');
const sequelize = require('../Config/database');
const User = require('./User');

const Applicant = sequelize.define('Applicant', {
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
  candidateId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
  },
  aadhaarMasked: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  aadhaarHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  gender: {
    type: DataTypes.ENUM('MALE','FEMALE','OTHER'),
    allowNull: true,
  },
}, {
  tableName: 'applicants',
  timestamps: true,
});

// Association
Applicant.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Applicant, { foreignKey: 'userId', as: 'applicant' });

module.exports = Applicant;