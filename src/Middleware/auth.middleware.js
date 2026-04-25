const jwt  = require('jsonwebtoken');
const User = require('../Models/User');

// VERIFY TOKEN
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const token   = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Sequelize: findByPk instead of findById
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated' });
    }

    // ✅ Sequelize: user.id instead of user._id
    req.user = {
      userId: user.id,
      role:   user.role,
      name:   user.name,
    };

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// AUTHORIZE ROLES
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. ${req.user ? req.user.role : 'Unknown'} is not allowed.`,
      });
    }
    next();
  };
};

module.exports = { verifyToken, authorizeRoles };