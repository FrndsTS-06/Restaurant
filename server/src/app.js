const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { CLIENT_URL, ALLOWED_ORIGINS } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');

const app = express();

// Trust reverse proxy (Render, Vercel, Cloudflare, AWS ALB)
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false
}));

// Cookie Parser
app.use(cookieParser());

// Dynamic Multi-Origin CORS Configuration
const originList = (ALLOWED_ORIGINS || CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile, server-to-server, curl, Postman, webhooks)
    if (!origin) return callback(null, true);
    if (originList.includes(origin) || originList.includes('*')) {
      return callback(null, true);
    }
    // Allow Vercel preview deployments if origin matches .vercel.app
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error(`CORS Error: Origin ${origin} not permitted.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id', 'x-request-id']
}));

// Body Parsers with Raw Body Preservation for Webhook Signature Verification
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true }));

// Request Logger
app.use(requestLogger);

// Static Uploads Serving
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

const { getSitemapXml, getRobotsTxt } = require('./controllers/seoController');

// Search Engine Optimization & Sitemap Routes
app.get('/sitemap.xml', getSitemapXml);
app.get('/robots.txt', getRobotsTxt);

// Basic Rate Limiting across API endpoints
app.use('/api', apiLimiter);

// API Routes
app.use('/api', routes);

// Root Health & Service Discovery
app.get('/', (req, res) => {
  res.json({
    name: 'RestaurantPro API Platform',
    version: '1.0.0',
    status: 'online',
    health: '/api/health',
    sitemap: '/sitemap.xml',
    robots: '/robots.txt',
    documentation: '/docs/api.md'
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.originalUrl} not found on RestaurantPro API.`
  });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
