const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN', 'LOGOUT', 'REFUND'],
      uppercase: true
    },
    entity: {
      type: String,
      required: true,
      enum: ['Order', 'MenuItem', 'Reservation', 'User', 'RestaurantTable', 'Payment', 'Coupon', 'RestaurantSettings', 'Auth'],
      trim: true
    },
    entityId: {
      type: String,
      default: ''
    },
    changes: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// Indexes
auditLogSchema.index({ entity: 1, action: 1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
