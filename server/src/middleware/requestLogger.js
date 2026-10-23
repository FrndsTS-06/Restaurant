const { NODE_ENV } = require('../config/env');

const requestLogger = (req, res, next) => {
  if (NODE_ENV === 'test') {
    return next();
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (NODE_ENV === 'production') {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
        ip: req.ip || req.headers['x-forwarded-for'] || '',
        userAgent: req.get('user-agent') || ''
      };
      console.log(JSON.stringify(logEntry));
    } else {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    }
  });
  next();
};

module.exports = requestLogger;

