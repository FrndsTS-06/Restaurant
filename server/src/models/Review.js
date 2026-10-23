const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    rating: {
      type: Number,
      required: [true, 'Please provide rating between 1 and 5'],
      min: 1,
      max: 5
    },
    title: {
      type: String,
      trim: true,
      maxlength: 100,
      default: ''
    },
    comment: {
      type: String,
      required: [true, 'Please provide review comments'],
      trim: true,
      maxlength: 1000
    },
    images: [{
      type: String
    }],
    isApproved: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['approved', 'pending', 'rejected'],
      default: 'approved'
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reviewSchema.index({ menuItem: 1, isApproved: 1 });
reviewSchema.index({ menuItem: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ user: 1, menuItem: 1, order: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });

module.exports = mongoose.model('Review', reviewSchema);
