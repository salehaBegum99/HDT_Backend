const Notification = require('../Models/Notification');

const createNotification = async (userId, title, message, type = 'GENERAL', link = null) => {
  try {
    await Notification.create({ userId, title, message, type, link });
  } catch (err) {
    console.log('Notification error:', err.message);
  }
};

module.exports = createNotification;