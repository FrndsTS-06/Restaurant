const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    reservationNumber: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RestaurantTable',
      default: null
    },
    guestName: {
      type: String,
      required: [true, 'Please provide guest name'],
      trim: true,
      maxlength: 100
    },
    guestEmail: {
      type: String,
      required: [true, 'Please provide guest email'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    guestPhone: {
      type: String,
      required: [true, 'Please provide contact number'],
      trim: true
    },
    guestsCount: {
      type: Number,
      required: [true, 'Please specify party size'],
      min: [1, 'Party size must be at least 1'],
      max: [20, 'Maximum party size for standard booking is 20']
    },
    reservationDate: {
      type: String,
      required: [true, 'Please select reservation date'],
      trim: true
    },
    timeSlot: {
      type: String,
      required: [true, 'Please select preferred time slot'],
      trim: true
    },
    endTimeSlot: {
      type: String,
      default: '',
      trim: true
    },
    seatingArea: {
      type: String,
      enum: ['Main Dining Salon', 'Window Alcove', 'Patio Terrace', 'Sommelier Cellar Room', 'Chef Counter'],
      default: 'Main Dining Salon'
    },
    tableNumber: {
      type: String,
      default: 'Table Assigned on Arrival',
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'rejected'],
      default: 'confirmed'
    },
    specialRequests: {
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
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reservationSchema.index(
  { table: 1, reservationDate: 1, timeSlot: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['confirmed', 'pending', 'seated'] } }
  }
);
reservationSchema.index({ reservationDate: 1, timeSlot: 1 });
reservationSchema.index({ reservationDate: 1, status: 1 });
reservationSchema.index({ table: 1, reservationDate: 1 });
reservationSchema.index({ guestEmail: 1 });
reservationSchema.index({ guestEmail: 1, reservationDate: -1 });
reservationSchema.index({ user: 1 });
reservationSchema.index({ user: 1, reservationDate: -1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reservation', reservationSchema);
