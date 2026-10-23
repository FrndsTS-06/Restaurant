const mongoose = require('mongoose');
const { sendError } = require('../utils/apiResponse');

// Validate Mongoose ObjectId in route parameters
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, `Invalid resource identifier: '${id}' is not a valid ObjectId`, 400);
    }
    next();
  };
};

// Validate & sanitize pagination query parameters
const validatePagination = (req, res, next) => {
  let page = parseInt(req.query.page, 10);
  let limit = parseInt(req.query.limit, 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 12;

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit
  };
  next();
};

module.exports = {
  validateObjectId,
  validatePagination
};
