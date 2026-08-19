'use strict';

/**
 * 200/201 success response
 */
function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * 400 (or custom) error response
 */
function errorResponse(res, message = 'Bad request', statusCode = 400, errors = []) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}

/**
 * 404 not found
 */
function notFoundResponse(res, resource = 'Resource') {
  return res.status(404).json({
    success: false,
    message: `${resource} not found`,
    errors: [],
  });
}

/**
 * 401 unauthorized
 */
function unauthorizedResponse(res, message = 'Unauthorized. Please login.') {
  return res.status(401).json({
    success: false,
    message,
    errors: [],
  });
}

/**
 * 403 forbidden
 */
function forbiddenResponse(res, message = 'Access denied.') {
  return res.status(403).json({
    success: false,
    message,
    errors: [],
  });
}

/**
 * Paginated response wrapper
 */
function paginatedResponse(res, data, total, page, limit, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      total,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(total / limit),
    },
  });
}

module.exports = {
  successResponse,
  errorResponse,
  notFoundResponse,
  unauthorizedResponse,
  forbiddenResponse,
  paginatedResponse,
};
