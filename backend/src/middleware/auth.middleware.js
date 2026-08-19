'use strict';

const { verifyToken } = require('../utils/jwt');
const { unauthorizedResponse } = require('../utils/responseHelper');

/**
 * Authenticate middleware — reads Bearer token, verifies JWT,
 * attaches decoded payload to req.user.
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided. Please login.');
    }

    const token = authHeader.slice(7); // remove "Bearer "
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return unauthorizedResponse(res, 'Session expired. Please login again.');
    }
    return unauthorizedResponse(res, 'Invalid token. Please login.');
  }
}

module.exports = { authenticate };
