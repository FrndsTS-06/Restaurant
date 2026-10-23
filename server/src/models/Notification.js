const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      email: { type: String, required: true, trim: true, lowercase: true },
      name: { type: String, default: '', trim: true }
    },
    type: {
      type: String,
      enum: [
        'order_placed',
        'order_status_update',
        'reservation_created',
        'reservation_status_update',
        'contact_inquiry',
        'custom'
      ],
      required: true
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    referenceModel: {
      type: String,
      enum: ['Order', 'Reservation', 'ContactMessage', 'User', ''],
      default: ''
    },
    subject: {
      type: String,
      required: true,
      trim: true
    },
    bodyHtml: {
      type: String,
      required: true
    },
    bodyText: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending'
    },
    deliveryAttempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    sentAt: {
      type: Date,
      default: null
    },
    lastAttemptAt: {
      type: Date,
      default: null
    },
    errorLogs: [
      {
        attempt: Number,
        error: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

notificationSchema.index({ status: 1, createdAt: -1 });
notificationSchema.index({ 'recipient.email': 1 });
notificationSchema.index({ 'recipient.email': 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
