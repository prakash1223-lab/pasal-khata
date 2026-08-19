'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOnly } = require('../middleware/role.middleware');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const { BCRYPT_SALT_ROUNDS } = require('../config/env');

const router = Router();

// GET /api/users — list staff for this shop (owner only)
router.get('/', authenticate, ownerOnly, async (req, res) => {
  try {
    const { shopId } = req.user;
    const users = await UserModel.findByShopId(shopId);
    // Never return password_hash
    const safe = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      isActive: u.is_active,
      createdAt: u.created_at,
    }));
    return successResponse(res, safe, 'Staff retrieved');
  } catch (err) {
    console.error('getUsers error:', err);
    return errorResponse(res, 'Failed to retrieve staff', 500);
  }
});

// POST /api/users — add a staff member (owner only)
router.post(
  '/',
  authenticate,
  ownerOnly,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('phone').optional().matches(/^9[6-9]\d{8}$/).withMessage('Enter a valid Nepal mobile number'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

      const { name, email, phone, password } = req.body;
      const { shopId } = req.user;

      const existing = await UserModel.findByEmail(email);
      if (existing) return errorResponse(res, 'Email already registered.', 409);

      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
      const user = await UserModel.create({ shopId, name, email, phone, passwordHash, role: 'staff' });

      return successResponse(res, {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      }, 'Staff member added', 201);
    } catch (err) {
      console.error('createUser error:', err);
      return errorResponse(res, 'Failed to add staff member', 500);
    }
  }
);

module.exports = router;
