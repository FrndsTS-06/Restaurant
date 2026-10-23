const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['customer', 'admin', 'staff', 'chef'],
      default: 'customer'
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80'
    },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      zipCode: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    permissions: {
      type: [String],
      default: ['orders', 'reservations', 'menu']
    },
    notes: {
      type: String,
      default: ''
    },
    lastLoginAt: {
      type: Date
    },
    refreshTokens: [
      {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true }
      }
    ],
    passwordResetToken: {
      type: String
    },
    passwordResetExpires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Indexes
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'refreshTokens.token': 1 });
userSchema.index({ passwordResetToken: 1 });

// Password hashing pre-save hook
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate crypto one-time password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and set to user document
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Token valid for 15 minutes
  this.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);

  return resetToken;
};

// Add active refresh token & clean up expired tokens
userSchema.methods.addRefreshToken = function (token, expiresAt) {
  const now = new Date();
  // Filter out any expired tokens
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > now);
  // Add new token
  this.refreshTokens.push({ token, expiresAt });
};

// Remove specific refresh token on logout or rotation
userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

module.exports = mongoose.model('User', userSchema);
