const express = require('express');
const router = express.Router();
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, forgotPasswordLimiter } = require('../middleware/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
  validateProfileUpdate,
  validateChangePassword
} = require('../validators/authValidator');

// Public authentication flows
router.post('/register', validateRegistration, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);
router.post('/forgot-password', forgotPasswordLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected customer / user profile management
router.get('/profile', protect, getProfile);
router.get('/me', protect, getProfile);
router.put('/profile', protect, validateProfileUpdate, updateProfile);
router.put('/change-password', protect, validateChangePassword, changePassword);

module.exports = router;
