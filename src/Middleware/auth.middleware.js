const jwt = require("jsonwebtoken");
const User = require("../Models/User");
// Removed duplicate require statements

// VERIFY TOKEN — checks if user is logged in
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive)
      return res.status(403).json({ message: "Account deactivated" });
    req.user = { userId: user._id, role: user.role, name: user.name };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

// AUTHORIZE ROLES — checks if user's role has permission
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: `Access denied. ${req.user ? req.user.role : "Unknown"} is not allowed to perform this action.`,
        });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };
