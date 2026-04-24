const express = require('express');
const router = express.Router();
const { verifyToken, authorizeRoles } = require('../Middleware/auth.middleware');
const {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} = require('../Controllers/notificationController');

router.get('/',                       verifyToken, getMyNotifications);
router.patch('/:notificationId/read', verifyToken, markAsRead);
router.patch('/mark-all-read',        verifyToken, markAllAsRead);

module.exports = router;