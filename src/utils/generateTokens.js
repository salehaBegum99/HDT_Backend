const jwt = require("jsonwebtoken");

// Generate Access Token → short lived (15 mins)
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { userId, role }, // What we store inside token
    process.env.JWT_SECRET, // Secret key to sign it
    { expiresIn: "15m" }, // Expires in 15 minutes
  );
};

// Generate Refresh Token → long lived (30 days)
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET, // Different secret for refresh
    { expiresIn: "30d" },
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
