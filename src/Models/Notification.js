const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['STATUS_CHANGE', 'INSPECTOR_ASSIGNED', 'DOCUMENT_REQUESTED', 'PAYMENT_DISBURSED', 'GENERAL'],
    default: 'GENERAL',
  },
  isRead:  { type: Boolean, default: false },
  link:    { type: String, default: null }, // e.g. /dashboard
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);