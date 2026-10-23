const mongoose = require('mongoose');
const { MONGODB_URI } = require('./env');

let isConnecting = false;

const connectDB = async (customUri = null) => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (isConnecting) {
    return;
  }

  const uri = customUri || MONGODB_URI;

  try {
    isConnecting = true;
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 25,
      minPoolSize: 2,
      heartbeatFrequencyMS: 10000
    });
    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️ MongoDB connection warning: ${error.message}`);
    console.warn(`ℹ️ Operating with in-memory mock fallback data until MongoDB is connected.`);
  } finally {
    isConnecting = false;
  }
};

// Reconnection & connection lifecycle event monitoring
mongoose.connection.on('connected', () => {
  console.log('📡 MongoDB connection established');
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected from server');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err.message);
});

const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    console.log('💤 MongoDB connection closed gracefully.');
  }
};

module.exports = {
  connectDB,
  closeDB,
  getIsConnected: () => mongoose.connection.readyState === 1
};

