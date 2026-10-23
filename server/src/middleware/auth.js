const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_ACCESS_SECRET, JWT_SECRET } = require('../config/env');
const { sendError } = require('../utils/apiResponse');

const protect = async (req, res, next) => {
  let token;

  // 1. Check Authorization Bearer header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // 2. Fall back to HTTP-only cookie if header not provided
  else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return sendError(res, 'Access denied. Please authenticate with a Bearer token or sign in.', 401);
  }

  try {
    // Verify token using access secret (fallback to JWT_SECRET)
    const secret = JWT_ACCESS_SECRET || JWT_SECRET;
    const decoded = jwt.verify(token, secret);

    // Verify user still exists in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return sendError(res, 'User belonging to this authentication token no longer exists.', 401);
    }

    if (!user.isActive) {
      return sendError(res, 'Your user account has been deactivated. Please contact restaurant administration.', 403);
    }

    req.user = {
      id: String(user._id),
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token has expired. Please refresh your session.', 401);
    }
    return sendError(res, 'Invalid authentication token.', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const currentRole = req.user ? req.user.role : 'unauthenticated';
      return sendError(
        res,
        `Forbidden: Role '${currentRole}' lacks permission to access this resource. Required role(s): ${roles.join(', ')}`,
        403
      );
    }
    next();
  };
};

const optionalProtect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const secret = JWT_ACCESS_SECRET || JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.id);
    if (user && user.isActive) {
      req.user = {
        id: String(user._id),
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      };
    } else {
      req.user = null;
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

module.exports = { protect, authorize, optionalProtect };


