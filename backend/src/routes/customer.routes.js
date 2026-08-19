'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const {
  getCustomers,
  getCustomer,
  getCustomerTransactions,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customer.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff, ownerOnly, ownerCanAccessAny } = require('../middleware/role.middleware');

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// GET /api/customers  — list (owner/staff only)
router.get('/', ownerOrStaff, getCustomers);

// POST /api/customers — create (owner/staff only)
router.post(
  '/',
  ownerOrStaff,
  [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('phone')
      .matches(/^9[6-9]\d{8}$/)
      .withMessage('Enter a valid Nepal mobile number'),
    body('address').optional().trim(),
  ],
  createCustomer
);

// GET /api/customers/:id — owner/staff sees all; customer sees own
router.get('/:id', ownerCanAccessAny, getCustomer);

// GET /api/customers/:id/transactions — same access rules
router.get('/:id/transactions', ownerCanAccessAny, getCustomerTransactions);

// PUT /api/customers/:id — owner/staff only
router.put(
  '/:id',
  ownerOrStaff,
  [
    body('name').trim().notEmpty().withMessage('Customer name is required'),
    body('phone')
      .optional()
      .matches(/^9[6-9]\d{8}$/)
      .withMessage('Enter a valid Nepal mobile number'),
    body('address').optional().trim(),
  ],
  updateCustomer
);

// DELETE /api/customers/:id — owner only
router.delete('/:id', ownerOnly, deleteCustomer);

module.exports = router;
