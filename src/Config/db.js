const sequelize = require('./database');

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL ✅');
      // ← Import all models so tables get created
    require('../Models/User');
    require('../Models/OTP');
    require('../Models/Applicant');
    require('../Models/Application');
    require('../Models/Notification');
    require('../Models/Tranche');
    require('../Models/InspectorVisitreport');
    require('../Models/SystemSettings');

    // Sync all models — creates tables if they don't exist
    await sequelize.sync({ alter: true });
    console.log('All tables synced ✅');

  } catch (error) {
    console.error('PostgreSQL connection error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    process.exit(1);
  }
};

module.exports = connectDB;