const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB, closeDB } = require('./config/db');

const startServer = async () => {
  // Connect to MongoDB
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Savoria Server running on http://localhost:${PORT}`);
    console.log(`📡 API Health Check available at http://localhost:${PORT}/api/health`);
  });

  // Graceful shutdown handling
  const shutdown = async () => {
    console.log('🛑 Shutting down server gracefully...');
    server.close(async () => {
      await closeDB();
      console.log('💤 Process terminated.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();
