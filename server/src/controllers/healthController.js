const mongoose = require('mongoose');

const getHealthStatus = (req, res) => {
  const readyStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  const dbStateNumber = mongoose.connection.readyState;
  const dbState = readyStates[dbStateNumber] || 'unknown';
  const isConnected = dbStateNumber === 1;
  const isHealthy = isConnected || process.env.NODE_ENV === 'test';

  const statusCode = isHealthy ? 200 : 503;

  res.status(statusCode).json({
    status: isConnected ? 'ok' : 'degraded',
    service: 'RestaurantPro API Platform',
    environment: process.env.NODE_ENV || 'development',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbState,
      connected: isConnected,
      readyState: dbStateNumber,
      host: mongoose.connection.host || 'unknown',
      name: mongoose.connection.name || 'restaurantpro_db'
    }
  });
};

module.exports = { getHealthStatus };
