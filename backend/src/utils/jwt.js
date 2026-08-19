'use strict';

const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');

/**
 * Sign a JWT with the given payload
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT. Throws if invalid or expired.
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/**
 * Generate a token for a customer (phone-only login)
 */
function generateCustomerToken(customerId, shopId) {
  return generateToken({
    id: customerId,
    customerId,
    shopId,
    role: 'customer',
  });
}

/**
 * Generate a token for an owner or staff user
 */
function generateUserToken(userId, shopId, role) {
  return generateToken({
    id: userId,
    userId,
    shopId,
    role,
  });
}

module.exports = { generateToken, verifyToken, generateCustomerToken, generateUserToken };
