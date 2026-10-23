const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle Mongoose CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    message = `Resource not found with identifier: '${err.value}'`;
    statusCode = 404;
  }

  // Handle Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `An account or record with this '${field}' already exists.`;
    statusCode = 400;
  }

  // Handle Mongoose schema validation error
  if (err.name === 'ValidationError') {
    errors = Object.values(err.errors).map(val => val.message);
    message = 'Validation error: ' + errors.join(', ');
    statusCode = 400;
  }

  // Handle JWT invalid signature
  if (err.name === 'JsonWebTokenError') {
    message = 'Invalid authentication token. Please sign in again.';
    statusCode = 401;
  }

  // Handle JWT token expired
  if (err.name === 'TokenExpiredError') {
    message = 'Authentication token has expired. Please sign in again.';
    statusCode = 401;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
