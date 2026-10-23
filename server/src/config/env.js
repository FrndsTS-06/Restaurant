const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restaurantpro_db',

  // Authentication & Tokens
  JWT_SECRET: process.env.JWT_SECRET || 'restaurantpro_secure_jwt_secret_key_2026_dev_auth',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || 'restaurantpro_secure_jwt_secret_key_2026_dev_auth',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'restaurantpro_secure_refresh_token_secret_key_2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Cookie Security Settings
  COOKIE_SETTINGS: {
    accessToken: {
      httpOnly: true,
      secure: process.env.COOKIE_SAME_SITE === 'none' ? true : isProduction,
      sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
      maxAge: 15 * 60 * 1000 // 15 minutes
    },
    refreshToken: {
      httpOnly: true,
      secure: process.env.COOKIE_SAME_SITE === 'none' ? true : isProduction,
      sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
  },

  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL || 'http://localhost:5173',

  // Rate Limiting & Security
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || (15 * 60 * 1000),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX, 10) || 300,

  // Error Monitoring & Observability
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  LOG_LEVEL: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),

  // Razorpay
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || 'rzp_test_restaurantpro2026',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || 'restaurantpro_rzp_secret_key_sandbox',
  RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'restaurantpro_rzp_webhook_secret_sandbox_2026',
  RAZORPAY_CURRENCY: process.env.RAZORPAY_CURRENCY || 'INR',

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',

  // Transactional Email Configuration
  EMAIL_DEV_MODE: process.env.EMAIL_DEV_MODE !== 'false',
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'SAVORIA Haute Cuisine <concierge@savoria.com>'
};
