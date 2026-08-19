'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  deactivateProduct,
} = require('../controllers/product.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { ownerOrStaff, ownerOnly } = require('../middleware/role.middleware');

const router = Router();

router.use(authenticate, ownerOrStaff);

// GET /api/products
router.get('/', getProducts);

// GET /api/products/:id
router.get('/:id', getProduct);

// POST /api/products
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('stockQuantity')
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be 0 or more'),
    body('category').optional().trim(),
    body('unit').optional().trim(),
  ],
  createProduct
);

// PUT /api/products/:id
router.put(
  '/:id',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0'),
    body('stockQuantity')
      .isInt({ min: 0 })
      .withMessage('Stock quantity must be 0 or more'),
  ],
  updateProduct
);

// PATCH /api/products/:id/deactivate — owner only
router.patch('/:id/deactivate', ownerOnly, deactivateProduct);

// DELETE /api/products/:id — owner only
router.delete('/:id', ownerOnly, deleteProduct);

module.exports = router;
