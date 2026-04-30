const Notification = require('../Models/Notification');

// GET all notifications
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ Sequelize: findAll with where + order + limit
    const notifications = await Notification.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });

    // ✅ Sequelize: count with where
    const unreadCount = await Notification.count({
      where: { userId, isRead: false }
    });

    res.status(200).json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH mark one as read
const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.userId;

    // ✅ Sequelize: update with where
    await Notification.update(
      { isRead: true },
      { where: { id: notificationId, userId } }
    );

    res.status(200).json({ message: 'Marked as read ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PATCH mark ALL as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    // ✅ Sequelize: update with where
    await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );

    res.status(200).json({ message: 'All marked as read ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };