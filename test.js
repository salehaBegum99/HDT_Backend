require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  String(process.env.DB_PASSWORD),
  {
    host:    process.env.DB_HOST,
    port:    Number(process.env.DB_PORT),
    dialect: 'postgres',
    logging: console.log,
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('✅ Connected to PostgreSQL!');
    process.exit(0);
  })
  .catch((err) => {
    console.log('❌ Connection failed:', err.message);
    process.exit(1);
  });