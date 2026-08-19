'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { validationResult } = require('express-validator');
const ShopModel = require('../models/shop.model');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOnly } = require('../middleware/role.middleware');
const { successResponse, errorResponse, notFoundResponse, forbiddenResponse } = require('../utils/responseHelper');

const router = Router();

// PUT /api/shops/:id
router.put(
  '/:id',
  authenticate,
  ownerOnly,
  [
    body('name').trim().notEmpty().withMessage('Shop name is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

      const { id } = req.params;
      const { shopId } = req.user;

      // Ensure owner can only update their own shop
      if (id !== shopId) {
        return forbiddenResponse(res, 'You can only update your own shop.');
      }

      const { name, address, phone } = req.body;
      const updated = await ShopModel.update(id, { name, address: address || null, phone: phone || null });
      if (!updated) return notFoundResponse(res, 'Shop');

      return successResponse(res, updated, 'Shop updated successfully.');
    } catch (err) {
      console.error('updateShop error:', err);
      return errorResponse(res, 'Failed to update shop.', 500);
    }
  }
);

module.exports = router;
