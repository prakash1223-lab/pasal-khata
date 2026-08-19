'use strict';

const { forbiddenResponse } = require('../utils/responseHelper');

/**
 * Only owners can access this route
 */
function ownerOnly(req, res, next) {
  if (req.user.role !== 'owner') {
    return forbiddenResponse(res, 'Owner access required.');
  }
  next();
}

/**
 * Owners and staff can access; customers cannot
 */
function ownerOrStaff(req, res, next) {
  const { role } = req.user;
  if (role !== 'owner' && role !== 'staff') {
    return forbiddenResponse(res, 'Staff or owner access required.');
  }
  next();
}

/**
 * Only customers can access this route
 */
function customerOnly(req, res, next) {
  if (req.user.role !== 'customer') {
    return forbiddenResponse(res, 'Customer access required.');
  }
  next();
}

/**
 * Owner can access any customer's data.
 * Staff can access any customer's data.
 * Customer can only access their own data.
 * Checks req.params.customerId (or req.params.id) against req.user.customerId.
 */
function ownerCanAccessAny(req, res, next) {
  const { role, customerId } = req.user;

  if (role === 'owner' || role === 'staff') {
    return next();
  }

  // Customer role: can only access own record
  const requestedId = req.params.customerId || req.params.id;
  if (role === 'customer' && customerId === requestedId) {
    return next();
  }

  return forbiddenResponse(res, 'You can only access your own khata.');
}

module.exports = { ownerOnly, ownerOrStaff, customerOnly, ownerCanAccessAny };
