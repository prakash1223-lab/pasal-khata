'use strict';

const { Router } = require('express');
const { getDashboard } = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff } = require('../middleware/role.middleware');

const router = Router();

// GET /api/dashboard
router.get('/', authenticate, ownerOrStaff, getDashboard);

module.exports = router;
