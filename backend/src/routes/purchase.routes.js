'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff } = require('../middleware/role.middleware');
const ctrl = require('../controllers/purchase.controller');

const router = Router();
router.use(authenticate);

router.get('/',    ownerOrStaff, ctrl.getPurchases);
router.get('/:id', ownerOrStaff, ctrl.getPurchase);

router.post('/', ownerOrStaff, [
  body('supplierId').notEmpty().withMessage('Supplier is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
], ctrl.createPurchase);

router.post('/:id/pay', ownerOrStaff, [
  body('amount').isFloat({ gt: 0 }).withMessage('Enter a valid amount'),
], ctrl.payPurchase);

module.exports = router;
