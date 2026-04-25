require('dotenv').config();
const sequelize      = require('../src/Config/database');
const SystemSettings = require('../src/Models/SystemSettings');

const seed = async () => {
  await sequelize.sync();

  const existing = await SystemSettings.findOne();
  if (existing) {
    console.log('Settings already exist!');
    process.exit(0);
  }

  await SystemSettings.create({
    defaultTotalTranches:  3,
    maxScholarshipAmount:  100000,
    minScholarshipAmount:  10000,
    documentRetentionDays: 365,
    applicationDeadline:   null,
  });

  console.log('Default system settings created! ✅');
  process.exit(0);
};

seed().catch(console.error);