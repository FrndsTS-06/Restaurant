const mongoose = require('mongoose');

const restaurantSettingsSchema = new mongoose.Schema(
  {
    restaurantName: {
      type: String,
      default: 'SAVORIA Haute Cuisine',
      trim: true
    },
    tagline: {
      type: String,
      default: 'Transcendent Gastronomy & Seasonal Harvests',
      trim: true
    },
    contactEmail: {
      type: String,
      default: 'concierge@savoria.com'
    },
    contactPhone: {
      type: String,
      default: '+1 (212) 555-0840'
    },
    address: {
      street: { type: String, default: '450 Avenue Montaigne' },
      city: { type: String, default: 'New York' },
      state: { type: String, default: 'NY' },
      zipCode: { type: String, default: '10022' }
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    taxRatePercent: {
      type: Number,
      default: 8.25
    },
    currency: {
      type: String,
      default: 'INR'
    },
    currencySymbol: {
      type: String,
      default: '₹'
    },
    operatingHours: {
      lunch: {
        open: { type: String, default: '12:00' },
        close: { type: String, default: '15:30' },
        active: { type: Boolean, default: false }
      },
      dinner: {
        open: { type: String, default: '17:00' },
        close: { type: String, default: '22:30' },
        active: { type: Boolean, default: true }
      },
      closedDays: [{ type: String, default: 'Monday' }]
    },
    bookingDurationMinutes: {
      type: Number,
      default: 90,
      min: 30,
      max: 240
    },
    bufferTimeMinutes: {
      type: Number,
      default: 15,
      min: 0,
      max: 60
    },
    slotIntervalMinutes: {
      type: Number,
      default: 30,
      min: 15,
      max: 60
    },
    minNoticeHours: {
      type: Number,
      default: 1,
      min: 0
    },
    maxAdvanceDays: {
      type: Number,
      default: 30,
      min: 1
    },
    cancellationNoticeHours: {
      type: Number,
      default: 2,
      min: 0
    },
    blockedDates: [{
      type: String,
      trim: true
    }],
    blockedTimeSlots: [{
      date: { type: String, required: true },
      timeSlot: { type: String, required: true },
      reason: { type: String, default: 'Special Event' }
    }],
    autoAcceptOrders: {
      type: Boolean,
      default: false
    },
    tableReservationIntervalMinutes: {
      type: Number,
      default: 30
    },
    homepageBanner: {
      enabled: { type: Boolean, default: true },
      text: { type: String, default: 'Autumn Truffle Festival — Reserve your exclusive tasting menu table.' },
      linkText: { type: String, default: 'Reserve Table' },
      linkUrl: { type: String, default: '/reservations' },
      badge: { type: String, default: 'Seasonal Special' }
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('RestaurantSettings', restaurantSettingsSchema);
