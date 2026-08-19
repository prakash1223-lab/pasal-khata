'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff } = require('../middleware/role.middleware');
const ctrl = require('../controllers/supplierPayment.controller');

const router = Router();
router.use(authenticate);

router.get('/',  ownerOrStaff, ctrl.getSupplierPayments);
router.post('/', ownerOrStaff, [
  body('supplierId').notEmpty().withMessage('Supplier is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Enter a valid amount'),
], ctrl.createSupplierPayment);

module.exports = router;
