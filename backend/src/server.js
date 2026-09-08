const app = require('./app');
const env = require('./config/env');
const logger = require('./utils/logger');
const { initDb } = require('./db/init');

async function startServer() {
  try {
    // Ensure DB Schema is initialized
    await initDb();

    app.listen(env.PORT, () => {
      logger.info(`CourierCRM Backend API running on http://localhost:${env.PORT}`);
      logger.info(`Environment: ${env.NODE_ENV}`);
      logger.info(`Database Mode: ${env.TURSO_AUTH_TOKEN ? 'Remote Turso Cloud' : 'Local libSQL File'}`);
    });
  } catch (err) {
    logger.error('Failed to start CourierCRM backend server:', err);
    process.exit(1);
  }
}

startServer();
