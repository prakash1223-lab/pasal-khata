'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { getSales, getSale, createSale } = require('../controllers/sale.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff } = require('../middleware/role.middleware');

const router = Router();

router.use(authenticate, ownerOrStaff);

// GET /api/sales
router.get('/', getSales);

// GET /api/sales/:id
router.get('/:id', getSale);

// POST /api/sales
router.post(
  '/',
  [
    body('customerId').isUUID().withMessage('Valid customerId is required'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('At least one item is required'),
    body('items.*.productId')
      .isUUID()
      .withMessage('Each item must have a valid productId'),
    body('items.*.quantity')
      .isFloat({ gt: 0 })
      .withMessage('Item quantity must be greater than 0'),
    body('items.*.unitPrice')
      .optional()
      .isFloat({ gt: 0 })
      .withMessage('Unit price must be greater than 0'),
    body('paidAmount')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Paid amount must be 0 or more'),
  ],
  createSale
);

module.exports = router;
