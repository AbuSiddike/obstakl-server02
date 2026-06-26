const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const response = {
    success: true,
    statusCode,
    message,
  };
  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;
  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message, error = null) => {
  const response = {
    success: false,
    statusCode,
    message,
  };
  if (error && process.env.NODE_ENV !== 'production') {
    response.error = error.stack || error;
  }
  return res.status(statusCode).json(response);
};

module.exports = {
  sendSuccess,
  sendError
};
