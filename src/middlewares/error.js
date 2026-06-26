const { sendError } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  return sendError(res, statusCode, message, err);
};

module.exports = errorHandler;
