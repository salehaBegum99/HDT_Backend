require('dotenv').config();
const bcrypt     = require('bcryptjs');
const sequelize  = require('../src/Config/database');
const User       = require('../src/Models/User');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to PostgreSQL ✅');

    await sequelize.sync();

    const exists = await User.findOne({
      where: { email: 'superadmin@scholarship.com' }
    });

    if (exists) {
      console.log('SuperAdmin already exists!');
      process.exit(0);
    }

    const password = await bcrypt.hash('Test@1234', 10);

    await User.create({
      name:             'Super Admin',
      email:            'superadmin@scholarship.com',
      mobile:           '9000000000',
      password,
      role:             'SUPERADMIN',
      isActive:         true,
      isMobileVerified: true,
      isFirstLogin:     false,
      refreshToken:     null,
    });

    console.log('SuperAdmin created! ✅');
    console.log('Email:    superadmin@scholarship.com');
    console.log('Password: Test@1234');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

seed();