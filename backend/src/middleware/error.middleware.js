const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Unhandled API Error:', err.stack || err.message || err);

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    message: `API Route Not Found - ${req.originalUrl}`
  });
}

module.exports = {
  errorHandler,
  notFoundHandler
};
