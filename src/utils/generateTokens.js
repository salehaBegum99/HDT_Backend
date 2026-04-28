const jwt = require('jsonwebtoken');

// ✅ Added name parameter
const generateAccessToken = (userId, role, name) => {
  return jwt.sign(
    { userId, role, name },       // ← Add name
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '30d' },
  );
};

module.exports = { generateAccessToken, generateRefreshToken };