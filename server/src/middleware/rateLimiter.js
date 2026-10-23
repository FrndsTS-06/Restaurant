const rateLimit = require('express-rate-limit');
const { NODE_ENV, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../config/env');

const isDevOrTest = NODE_ENV === 'test' || NODE_ENV === 'development';
const isTest = NODE_ENV === 'test';

// General API rate limiter: protects entire API against scraping and flood attacks
const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: isDevOrTest ? 20000 : RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this client. Please slow down and try again later.'
  }
});

// Login rate limiter: protects against brute-force password guessing
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevOrTest ? 2000 : 10, // Generous in dev/test, strict in production
  standardHeaders: true, // Return standard RateLimit headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
  },
  skipSuccessfulRequests: false
});

// Forgot password rate limiter: protects against email harvesting / spam
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevOrTest ? 500 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again after 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  loginLimiter,
  forgotPasswordLimiter
};

