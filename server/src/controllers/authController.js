const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const {
  JWT_SECRET,
  JWT_ACCESS_SECRET,
  JWT_ACCESS_EXPIRES_IN,
  JWT_REFRESH_SECRET,
  JWT_REFRESH_EXPIRES_IN,
  COOKIE_SETTINGS
} = require('../config/env');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Token generation helpers
const generateTokens = (user) => {
  const accessSecret = JWT_ACCESS_SECRET || JWT_SECRET;
  const accessToken = jwt.sign(
    {
      id: String(user._id),
      role: user.role,
      name: user.name,
      email: user.email
    },
    accessSecret,
    { expiresIn: JWT_ACCESS_EXPIRES_IN || '15m' }
  );

  const refreshToken = jwt.sign(
    {
      id: String(user._id),
      jti: crypto.randomBytes(16).toString('hex')
    },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { accessToken, refreshToken };
};

// Set secure HTTP-only cookies
const setAuthCookies = (res, accessToken, refreshToken) => {
  if (accessToken) {
    res.cookie('accessToken', accessToken, COOKIE_SETTINGS.accessToken);
  }
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, COOKIE_SETTINGS.refreshToken);
  }
};

// Clear HTTP-only cookies on logout
const clearAuthCookies = (res) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    sameSite: COOKIE_SETTINGS.accessToken.sameSite,
    secure: COOKIE_SETTINGS.accessToken.secure
  });
  res.clearCookie('refreshToken', {
    httpOnly: true,
    sameSite: COOKIE_SETTINGS.refreshToken.sameSite,
    secure: COOKIE_SETTINGS.refreshToken.secure
  });
};

// Sanitize user object for responses
const sanitizeUser = (user) => {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone || '',
    avatar: user.avatar || '',
    address: user.address || {},
    createdAt: user.createdAt
  };
};

// @desc    Register new customer (Public registration ONLY for customers)
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return sendError(res, 'Please provide name, email, and password', 400);
    }

    if (password.length < 6) {
      return sendError(res, 'Password must be at least 6 characters', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(res, 'An account with this email address already exists', 400);
    }

    // MANDATORY SECURITY RULE:
    // Public registration ALWAYS assigns the 'customer' role.
    // Admin and staff roles must be provisioned via protected seeds/bootstrap.
    const user = new User({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: 'customer'
    });

    const { accessToken, refreshToken } = generateTokens(user);
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.addRefreshToken(refreshToken, refreshExpiry);
    user.lastLoginAt = new Date();
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(
      res,
      {
        token: accessToken,
        refreshToken,
        user: sanitizeUser(user)
      },
      'Customer account created successfully',
      201
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user (Customer, Staff, Admin)
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 'Please provide email and password', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return sendError(res, 'Invalid email or password', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your account is deactivated. Please contact restaurant administration.', 403);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401);
    }

    const { accessToken, refreshToken } = generateTokens(user);
    const refreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.addRefreshToken(refreshToken, refreshExpiry);
    user.lastLoginAt = new Date();
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    // Audit log administrative and staff logins
    if (user.role === 'admin' || user.role === 'staff') {
      await AuditLog.create({
        user: user._id,
        action: 'UPDATE',
        entity: 'User',
        entityId: String(user._id),
        changes: { event: 'ADMIN_LOGIN', role: user.role, email: user.email },
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') || ''
      }).catch(err => console.warn('AuditLog error:', err.message));
    }

    return sendSuccess(
      res,
      {
        token: accessToken,
        refreshToken,
        user: sanitizeUser(user)
      },
      'Logged in successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Rotate refresh token and issue new access token
// @route   POST /api/auth/refresh-token
const refreshToken = async (req, res, next) => {
  try {
    const receivedToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!receivedToken) {
      return sendError(res, 'Refresh token is required. Please sign in.', 401);
    }

    let decoded;
    try {
      decoded = jwt.verify(receivedToken, JWT_REFRESH_SECRET);
    } catch (err) {
      clearAuthCookies(res);
      return sendError(res, 'Invalid or expired refresh token. Please sign in again.', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      clearAuthCookies(res);
      return sendError(res, 'User session invalid or user inactive', 401);
    }

    // Check if refresh token is in active tokens list
    const tokenRecord = user.refreshTokens.find(rt => rt.token === receivedToken);
    if (!tokenRecord) {
      // Possible token reuse attack detected! Revoke all tokens for safety
      user.refreshTokens = [];
      await user.save();
      clearAuthCookies(res);
      return sendError(res, 'Session token expired or revoked. Please sign in again.', 401);
    }

    // Token rotation: remove old refresh token
    user.removeRefreshToken(receivedToken);

    // Issue brand new access token and new refresh token
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    const newRefreshExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    user.addRefreshToken(newRefreshToken, newRefreshExpiry);
    await user.save();

    setAuthCookies(res, accessToken, newRefreshToken);

    return sendSuccess(
      res,
      {
        token: accessToken,
        refreshToken: newRefreshToken,
        user: sanitizeUser(user)
      },
      'Token refreshed successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user and invalidate refresh token
// @route   POST /api/auth/logout
const logout = async (req, res, next) => {
  try {
    const receivedToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (receivedToken) {
      try {
        const decoded = jwt.verify(receivedToken, JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          user.removeRefreshToken(receivedToken);
          await user.save();
        }
      } catch (err) {
        // Ignore token verification errors during logout
      }
    }

    clearAuthCookies(res);

    return sendSuccess(res, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset token
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 'Please provide an email address', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // If user does not exist, return neutral response to prevent email discovery
    if (!user) {
      return sendSuccess(
        res,
        null,
        'If an account with that email exists, a password reset token has been generated.'
      );
    }

    // Generate reset token and save to DB
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In a production email service, you would send an email with the link:
    // const resetUrl = `${CLIENT_URL}/reset-password/${resetToken}`;

    return sendSuccess(
      res,
      {
        resetToken,
        expiresInMinutes: 15
      },
      'Password reset token generated successfully. Valid for 15 minutes.'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using one-time token
// @route   POST /api/auth/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const rawToken = req.params.token || req.body.token;
    const newPassword = req.body.password || req.body.newPassword;

    if (!rawToken) {
      return sendError(res, 'Password reset token is required', 400);
    }

    if (!newPassword || newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }

    // Hash token to compare with DB
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return sendError(res, 'Password reset token is invalid or has expired', 400);
    }

    // Set new password (will be hashed by userSchema pre-save hook)
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all active sessions for security
    user.refreshTokens = [];
    await user.save();

    clearAuthCookies(res);

    // Audit log password reset
    await AuditLog.create({
      user: user._id,
      action: 'UPDATE',
      entity: 'User',
      entityId: String(user._id),
      changes: { event: 'PASSWORD_RESET', email: user.email },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, null, 'Password reset successfully. You may now sign in with your new password.');
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated user profile
// @route   GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    return sendSuccess(res, sanitizeUser(user), 'Profile retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer profile details
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, avatar } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar) user.avatar = avatar;
    if (address && typeof address === 'object') {
      user.address = {
        street: address.street !== undefined ? address.street : user.address.street,
        city: address.city !== undefined ? address.city : user.address.city,
        state: address.state !== undefined ? address.state : user.address.state,
        zipCode: address.zipCode !== undefined ? address.zipCode : user.address.zipCode
      };
    }

    await user.save();

    return sendSuccess(res, sanitizeUser(user), 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Change password while logged in
// @route   PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Please provide both current and new passwords', 400);
    }

    if (newPassword.length < 6) {
      return sendError(res, 'New password must be at least 6 characters long', 400);
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return sendError(res, 'Current password is incorrect', 400);
    }

    user.password = newPassword;
    // Clear other refresh tokens to terminate stale sessions
    user.refreshTokens = [];
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'UPDATE',
      entity: 'User',
      entityId: String(user._id),
      changes: { event: 'PASSWORD_CHANGE', email: user.email },
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') || ''
    }).catch(err => console.warn('AuditLog error:', err.message));

    return sendSuccess(res, null, 'Password updated successfully. Please sign in again.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
};
