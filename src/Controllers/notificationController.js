const Notification = require('../Models/Notification');

// GET all notifications for logged in user
const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

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

    await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true }
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
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.status(200).json({ message: 'All marked as read ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };