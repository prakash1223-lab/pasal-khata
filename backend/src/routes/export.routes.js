'use strict';

const router = require('express').Router();
const { authenticate }   = require('../middleware/auth.middleware');
const { ownerOnly }      = require('../middleware/role.middleware');
const {
  exportAll, exportCustomers, exportSales, exportExcel,
  backupStatus, triggerBackup,
} = require('../controllers/export.controller');

// All export routes require authentication + owner role
router.use(authenticate, ownerOnly);

router.get('/all',            exportAll);
router.get('/customers',      exportCustomers);
router.get('/sales',          exportSales);
router.get('/excel',          exportExcel);
router.get('/backup-status',  backupStatus);
router.post('/backup',        triggerBackup);

module.exports = router;
