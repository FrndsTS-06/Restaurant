/**
 * Authentication and User Profile Validators
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+]?[-0-9\s().]{7,30}$/;

const validateRegistration = (req, res, next) => {
  const { name, email, password, phone } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters.');
  } else if (name.trim().length > 100) {
    errors.push('Full name cannot exceed 100 characters.');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters.');
  } else if (password.length > 128) {
    errors.push('Password cannot exceed 128 characters.');
  }

  if (phone && (typeof phone !== 'string' || !PHONE_REGEX.test(phone.trim()))) {
    errors.push('Please provide a valid phone number (e.g. +1 555-0199).');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  if (!password || typeof password !== 'string' || password.trim().length === 0) {
    errors.push('Password is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

const validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address.'
    });
  }
  next();
};

const validateResetPassword = (req, res, next) => {
  const rawToken = req.params?.token || req.body?.token;
  const newPassword = req.body?.password || req.body?.newPassword;

  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Password reset token is required.'
    });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.'
    });
  }

  if (newPassword.length > 128) {
    return res.status(400).json({
      success: false,
      message: 'Password cannot exceed 128 characters.'
    });
  }

  next();
};

const validateProfileUpdate = (req, res, next) => {
  const { name, phone, address } = req.body;
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters.');
    } else if (name.trim().length > 100) {
      errors.push('Name cannot exceed 100 characters.');
    }
  }

  if (phone !== undefined && phone.trim() !== '') {
    if (!PHONE_REGEX.test(phone.trim())) {
      errors.push('Please provide a valid phone number.');
    }
  }

  if (address && typeof address === 'object') {
    if (address.zipCode && typeof address.zipCode === 'string' && address.zipCode.trim().length > 15) {
      errors.push('Zip code cannot exceed 15 characters.');
    }
    if (address.street && typeof address.street === 'string' && address.street.trim().length > 150) {
      errors.push('Street address cannot exceed 150 characters.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors
    });
  }

  next();
};

const validateChangePassword = (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || typeof currentPassword !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Current password is required.'
    });
  }

  if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long.'
    });
  }

  if (newPassword.length > 128) {
    return res.status(400).json({
      success: false,
      message: 'New password cannot exceed 128 characters.'
    });
  }

  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: 'New password cannot be identical to current password.'
    });
  }

  next();
};

module.exports = {
  EMAIL_REGEX,
  PHONE_REGEX,
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateChangePassword
};
