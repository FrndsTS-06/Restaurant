const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  specialInstructions: {
    type: String,
    default: '',
    trim: true
  }
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    sessionId: {
      type: String,
      default: null,
      trim: true
    },
    orderType: {
      type: String,
      enum: ['delivery', 'pickup', 'dine-in'],
      default: 'delivery'
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    couponCode: {
      type: String,
      default: ''
    },
    totalAmount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });
cartSchema.index({ updatedAt: -1 });

// Recalculate cart totals strictly on backend
cartSchema.methods.calculateTotals = function () {
  this.subtotal = Math.round(
    this.items.reduce((sum, item) => sum + (Number(item.price) * Number(item.quantity)), 0) * 100
  ) / 100;

  if (this.subtotal === 0) {
    this.discount = 0;
    this.couponCode = '';
  } else if (this.discount > this.subtotal) {
    this.discount = this.subtotal;
  }

  // 8.25% standard sales tax
  this.tax = Math.round(this.subtotal * 0.0825 * 100) / 100;

  // $5 delivery fee for delivery orders under $100; free delivery on orders >= $100
  this.deliveryFee = this.orderType === 'delivery' && this.subtotal > 0
    ? (this.subtotal >= 100 ? 0 : 5.00)
    : 0;

  this.totalAmount = Math.max(
    0,
    Math.round((this.subtotal + this.tax + this.deliveryFee - Number(this.discount || 0)) * 100) / 100
  );

  return this.totalAmount;
};

module.exports = mongoose.model('Cart', cartSchema);
