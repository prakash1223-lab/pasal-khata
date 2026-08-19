'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff, ownerOnly } = require('../middleware/role.middleware');
const ctrl = require('../controllers/supplier.controller');

const router = Router();
router.use(authenticate);

router.get('/',                 ownerOrStaff, ctrl.getSuppliers);
router.get('/:id',              ownerOrStaff, ctrl.getSupplier);
router.get('/:id/transactions', ownerOrStaff, ctrl.getSupplierTransactions);

router.post('/', ownerOrStaff, [
  body('name').trim().notEmpty().withMessage('Supplier name is required'),
], ctrl.createSupplier);

router.put('/:id',    ownerOrStaff, ctrl.updateSupplier);
router.delete('/:id', ownerOnly,    ctrl.deleteSupplier);

module.exports = router;
