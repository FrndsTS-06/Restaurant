const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'card', 'cash', 'gift_card'],
      default: 'razorpay'
    },
    paymentGateway: {
      orderId: { type: String, default: '' },
      paymentId: { type: String, default: '' },
      signature: { type: String, default: '' }
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'refunded'],
      default: 'pending'
    },
    failureReason: {
      type: String,
      default: ''
    },
    attemptsCount: {
      type: Number,
      default: 1
    },
    idempotencyKey: {
      type: String,
      default: ''
    },
    refundDetails: {
      refundId: { type: String, default: '' },
      amount: { type: Number, default: 0 },
      reason: { type: String, default: '' },
      refundedAt: { type: Date, default: null }
    },
    webhookEvents: [
      {
        event: { type: String },
        receivedAt: { type: Date, default: Date.now },
        eventId: { type: String }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Indexes
paymentSchema.index({ order: 1 });
paymentSchema.index({ 'paymentGateway.orderId': 1 });
paymentSchema.index({ 'paymentGateway.paymentId': 1 });
paymentSchema.index({ idempotencyKey: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);
