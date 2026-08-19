'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { register, login, customerLogin, getMe, changePassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = Router();

// POST /api/auth/register
router.post(
  '/register',
  [
    body('shopName').trim().notEmpty().withMessage('Shop name is required'),
    body('ownerName').trim().notEmpty().withMessage('Owner name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters'),
    body('phone')
      .optional()
      .matches(/^9[6-9]\d{8}$/)
      .withMessage('Enter a valid Nepal mobile number'),
  ],
  register
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  login
);

// POST /api/auth/customer-login
router.post(
  '/customer-login',
  [
    body('phone')
      .matches(/^9[6-9]\d{8}$/)
      .withMessage('Enter a valid Nepal mobile number (10 digits starting with 98/97/96)'),
    body('shopId').isUUID().withMessage('Valid shopId is required'),
  ],
  customerLogin
);

// GET /api/auth/me
router.get('/me', authenticate, getMe);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  changePassword
);

module.exports = router;
