const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: [true, 'Please provide your email address'],
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      default: '',
      trim: true
    },
    subject: {
      type: String,
      required: [true, 'Please provide a subject'],
      trim: true,
      maxlength: 150
    },
    message: {
      type: String,
      required: [true, 'Please enter your message'],
      trim: true,
      maxlength: 2000
    },
    status: {
      type: String,
      enum: ['unread', 'read', 'responded', 'archived'],
      default: 'unread'
    },
    ipAddress: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

contactMessageSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
