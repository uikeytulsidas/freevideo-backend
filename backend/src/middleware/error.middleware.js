function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    message: 'Route not found.',
  });
}

function errorHandler(error, _req, res, _next) {
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Something went wrong.',
    error: process.env.NODE_ENV === 'development' ? String(error.stack || error) : undefined,
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
