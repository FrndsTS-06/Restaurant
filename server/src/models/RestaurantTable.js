const mongoose = require('mongoose');

const restaurantTableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, 'Please provide table number'],
      unique: true,
      trim: true
    },
    capacity: {
      type: Number,
      required: [true, 'Please specify seating capacity'],
      min: [1, 'Capacity must be at least 1 person'],
      max: [20, 'Capacity cannot exceed 20 people']
    },
    minCapacity: {
      type: Number,
      default: 1,
      min: 1
    },
    location: {
      type: String,
      enum: ['Main Dining Salon', 'Window Alcove', 'Patio Terrace', 'Sommelier Cellar Room', 'Chef Counter'],
      default: 'Main Dining Salon'
    },
    status: {
      type: String,
      enum: ['available', 'reserved', 'occupied', 'cleaning', 'maintenance'],
      default: 'available'
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    blockedReason: {
      type: String,
      default: '',
      trim: true
    },
    qrCodeToken: {
      type: String,
      default: () => `tbl_qr_${Math.random().toString(36).substring(2, 10)}`
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
restaurantTableSchema.index({ status: 1 });
restaurantTableSchema.index({ capacity: 1 });
restaurantTableSchema.index({ location: 1 });
restaurantTableSchema.index({ isActive: 1, isBlocked: 1 });

module.exports = mongoose.model('RestaurantTable', restaurantTableSchema);
