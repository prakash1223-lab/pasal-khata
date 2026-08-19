'use strict';

const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const { getClient } = require('../config/db');
const ShopModel = require('../models/shop.model');
const UserModel = require('../models/user.model');
const CustomerModel = require('../models/customer.model');
const { generateCustomerToken, generateUserToken } = require('../utils/jwt');
const { successResponse, errorResponse, notFoundResponse, unauthorizedResponse } = require('../utils/responseHelper');
const { BCRYPT_SALT_ROUNDS } = require('../config/env');

// POST /api/auth/register
async function register(req, res) {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      client.release();
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { shopName, ownerName, email, password, phone, address } = req.body;

    // Check if email already taken (case-insensitive)
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      client.release();
      return errorResponse(res, 'Email already registered. Please login.', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // Wrap shop + user creation in a transaction
    await client.query('BEGIN');

    const shopRes = await client.query(
      `INSERT INTO shops (name, address, phone) VALUES ($1, $2, $3) RETURNING *`,
      [shopName, address || null, phone || null]
    );
    const shop = shopRes.rows[0];

    const userRes = await client.query(
      `INSERT INTO users (shop_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, shop_id, name, email, phone, role, is_active, created_at`,
      [shop.id, ownerName, email.toLowerCase(), phone || null, passwordHash, 'owner']
    );
    const user = userRes.rows[0];

    await client.query('COMMIT');

    const token = generateUserToken(user.id, shop.id, 'owner');

    return successResponse(
      res,
      {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          shopId: shop.id,
        },
        shop: {
          id: shop.id,
          name: shop.name,
          address: shop.address,
          phone: shop.phone,
        },
      },
      'Shop registered successfully',
      201
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('register error:', err);
    return errorResponse(res, 'Registration failed. Please try again.', 500);
  } finally {
    client.release();
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { email, password } = req.body;

    const user = await UserModel.findByEmail(email);
    if (!user) {
      return unauthorizedResponse(res, 'Invalid email or password.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return unauthorizedResponse(res, 'Invalid email or password.');
    }

    const shop = await ShopModel.findById(user.shop_id);
    const token = generateUserToken(user.id, user.shop_id, user.role);

    return successResponse(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        shopId: user.shop_id,
      },
      shop: shop
        ? { id: shop.id, name: shop.name, address: shop.address, phone: shop.phone }
        : null,
    }, 'Login successful');
  } catch (err) {
    console.error('login error:', err);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
}

// POST /api/auth/customer-login
async function customerLogin(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { phone, shopId } = req.body;

    // Strip spaces/dashes before lookup
    const cleanPhone = (phone || '').replace(/[\s\-]/g, '');

    const customer = await CustomerModel.findByPhone(cleanPhone, shopId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found. Ask your shopkeeper to add you.',
        errors: [],
      });
    }

    const token = generateCustomerToken(customer.id, shopId);
    const shop = await ShopModel.findById(shopId);

    return successResponse(res, {
      token,
      customer: {
        id: customer.id,
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        baki: customer.baki,
        totalPurchased: customer.total_purchased,
        totalPaid: customer.total_paid,
        shopId,
        role: 'customer',
      },
      shop: shop ? { id: shop.id, name: shop.name } : null,
    }, 'Login successful');
  } catch (err) {
    console.error('customerLogin error:', err);
    return errorResponse(res, 'Login failed. Please try again.', 500);
  }
}

// GET /api/auth/me
async function getMe(req, res) {
  try {
    // JWT payload uses 'id' — userId is an alias set in generateUserToken
    const { role, id, userId, customerId, shopId } = req.user;

    if (role === 'customer') {
      const cId = customerId ?? id;
      const customer = await CustomerModel.findById(cId, shopId);
      if (!customer) return notFoundResponse(res, 'Customer');
      return successResponse(res, {
        role: 'customer',
        id: customer.id,
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        address: customer.address,
        baki: customer.baki,
        totalPurchased: customer.total_purchased,
        totalPaid: customer.total_paid,
        shopId,
      });
    }

    // owner or staff — use userId OR id (whichever is set)
    const uId = userId ?? id;
    const user = await UserModel.findById(uId);
    if (!user) return notFoundResponse(res, 'User');
    const shop = await ShopModel.findById(shopId);

    return successResponse(res, {
      role: user.role,
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      shopId: user.shop_id,
      shopName: shop?.name ?? 'My Shop',
      shop: shop ? { id: shop.id, name: shop.name, address: shop.address, phone: shop.phone } : null,
    });
  } catch (err) {
    console.error('getMe error:', err);
    return errorResponse(res, 'Could not retrieve profile.', 500);
  }
}

// PUT /api/auth/change-password
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, userId, role } = req.user;

    if (role === 'customer') {
      return errorResponse(res, 'Customers cannot change password.', 403);
    }

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 'Current password and new password are required.', 400);
    }

    if (newPassword.length < 8) {
      return errorResponse(res, 'New password must be at least 8 characters.', 400);
    }

    const uId = userId ?? id;
    // Need to get full user with password_hash
    const { query } = require('../config/db');
    const userRes = await query(`SELECT * FROM users WHERE id = $1`, [uId]);
    const user = userRes.rows[0];
    if (!user) return notFoundResponse(res, 'User');

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return errorResponse(res, 'Current password is incorrect.', 400);
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await UserModel.updatePassword(uId, newHash);

    return successResponse(res, {}, 'Password updated successfully.');
  } catch (err) {
    console.error('changePassword error:', err);
    return errorResponse(res, 'Failed to change password.', 500);
  }
}

module.exports = { register, login, customerLogin, getMe, changePassword };
