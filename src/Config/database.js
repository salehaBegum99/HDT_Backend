require('dotenv').config(); // ← Must be at top before anything else

const { Sequelize } = require('sequelize');

// Debug — check values are loading
console.log('DB Config:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  name: process.env.DB_NAME,
  user: process.env.DB_USER,
  passType: typeof process.env.DB_PASSWORD,
});

const sequelize = new Sequelize(
  process.env.DB_NAME     || 'scholarship_db',
  process.env.DB_USER     || 'postgres',
  String(process.env.DB_PASSWORD || 'postgres123'), // ← Force string
  {
    host:    process.env.DB_HOST || 'localhost',
    port:    Number(process.env.DB_PORT) || 5432,
    dialect: 'postgres',           // ← Must be hardcoded, not from env
    logging: false,
    pool: {
      max: 5, min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

module.exports = sequelize;