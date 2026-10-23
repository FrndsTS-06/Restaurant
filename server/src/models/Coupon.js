const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 40
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
      default: 'percentage'
    },
    discountValue: {
      type: Number,
      required: [true, 'Please provide discount amount or percentage'],
      min: [1, 'Discount value must be at least 1']
    },
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      default: null // null for fixed or unlimited percentage
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    expiryDate: {
      type: Date,
      required: [true, 'Please specify expiry date']
    },
    usageLimit: {
      type: Number,
      default: 100
    },
    usageCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
couponSchema.index({ isActive: 1, expiryDate: 1 });

// Helper to check validity
couponSchema.methods.isValidForOrder = function (orderAmount) {
  const now = new Date();
  if (!this.isActive) return { valid: false, message: 'Coupon is inactive' };
  if (now > this.expiryDate) return { valid: false, message: 'Coupon has expired' };
  if (now < this.startDate) return { valid: false, message: 'Coupon is not yet active' };
  if (this.usageCount >= this.usageLimit) return { valid: false, message: 'Coupon usage limit reached' };
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, message: `Minimum order amount of ₹${this.minOrderAmount} required` };
  }

  let calculatedDiscount = 0;
  if (this.discountType === 'percentage') {
    calculatedDiscount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscountAmount && calculatedDiscount > this.maxDiscountAmount) {
      calculatedDiscount = this.maxDiscountAmount;
    }
  } else {
    calculatedDiscount = Math.min(this.discountValue, orderAmount);
  }

  return {
    valid: true,
    discountAmount: Math.round(calculatedDiscount * 100) / 100
  };
};

module.exports = mongoose.model('Coupon', couponSchema);
