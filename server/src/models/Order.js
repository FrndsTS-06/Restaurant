const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
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
    min: 1
  },
  specialInstructions: {
    type: String,
    default: '',
    trim: true
  }
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true
  },
  changedAt: {
    type: Date,
    default: Date.now
  },
  note: {
    type: String,
    default: ''
  }
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    idempotencyKey: {
      type: String,
      default: null,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    customer: {
      name: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true, lowercase: true },
      phone: { type: String, default: '', trim: true }
    },
    items: [orderItemSchema],
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      default: null
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null
    },
    subtotal: {
      type: Number,
      required: true,
      default: 0
    },
    tax: {
      type: Number,
      required: true,
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
    tip: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true
    },
    status: {
      type: String,
      enum: ['placed', 'pending', 'confirmed', 'preparing', 'ready', 'completed', 'delivered', 'cancelled'],
      default: 'placed'
    },
    orderType: {
      type: String,
      enum: ['dine-in', 'pickup', 'delivery', 'takeaway', 'curbside'],
      default: 'delivery'
    },
    tableNumber: {
      type: String,
      default: '',
      trim: true
    },
    deliveryAddress: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    specialNotes: {
      type: String,
      default: '',
      trim: true
    },
    cancellationReason: {
      type: String,
      default: ''
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'admin', 'staff', 'system', ''],
      default: ''
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'paid'
    },
    statusHistory: [statusHistorySchema]
  },
  {
    timestamps: true
  }
);

// Indexes
orderSchema.index({ 'customer.email': 1 });
orderSchema.index({ 'customer.email': 1, createdAt: -1 });
orderSchema.index({ user: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.menuItem': 1 });
orderSchema.index({ idempotencyKey: 1 }, { sparse: true });

module.exports = mongoose.model('Order', orderSchema);
