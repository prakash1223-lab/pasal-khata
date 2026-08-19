'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { getPayments, createPayment } = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff } = require('../middleware/role.middleware');

const router = Router();

router.use(authenticate, ownerOrStaff);

// GET /api/payments
router.get('/', getPayments);

// POST /api/payments
router.post(
  '/',
  [
    body('customerId').isUUID().withMessage('Valid customerId is required'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('paymentMethod')
      .optional()
      .isIn(['cash', 'esewa', 'khalti', 'bank'])
      .withMessage('Payment method must be cash, esewa, khalti, or bank'),
    body('note').optional().trim(),
  ],
  createPayment
);

module.exports = router;
