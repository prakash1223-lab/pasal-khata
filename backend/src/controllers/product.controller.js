'use strict';

const { validationResult } = require('express-validator');
const ProductModel = require('../models/product.model');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/responseHelper');

// GET /api/products
async function getProducts(req, res) {
  try {
    const { search = '', category = '', page = 1, limit = 50 } = req.query;
    const { shopId } = req.user;

    const { data, total } = await ProductModel.findAll(shopId, {
      search,
      category,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return paginatedResponse(res, data, total, page, limit, 'Products retrieved');
  } catch (err) {
    console.error('getProducts error:', err);
    return errorResponse(res, 'Failed to retrieve products', 500);
  }
}

// GET /api/products/:id
async function getProduct(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const product = await ProductModel.findById(id, shopId);
    if (!product) return notFoundResponse(res, 'Product');

    return successResponse(res, product);
  } catch (err) {
    console.error('getProduct error:', err);
    return errorResponse(res, 'Failed to retrieve product', 500);
  }
}

// POST /api/products
async function createProduct(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { name, category, price, stockQuantity, unit, costPrice } = req.body;
    const { shopId } = req.user;

    const product = await ProductModel.create({
      shopId,
      name,
      category: category || null,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10) || 0,
      unit: unit || 'piece',
      costPrice: costPrice ? parseFloat(costPrice) : null,
    });

    return successResponse(res, product, 'Product created', 201);
  } catch (err) {
    console.error('createProduct error:', err);
    return errorResponse(res, 'Failed to create product', 500);
  }
}

// PUT /api/products/:id
async function updateProduct(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { shopId } = req.user;
    const { name, category, price, stockQuantity, unit, costPrice } = req.body;

    const existing = await ProductModel.findById(id, shopId);
    if (!existing) return notFoundResponse(res, 'Product');

    const updated = await ProductModel.update(id, shopId, {
      name,
      category,
      price: parseFloat(price),
      stockQuantity: parseInt(stockQuantity, 10),
      unit,
      costPrice: costPrice !== undefined ? parseFloat(costPrice) : undefined,
    });

    return successResponse(res, updated, 'Product updated');
  } catch (err) {
    console.error('updateProduct error:', err);
    return errorResponse(res, 'Failed to update product', 500);
  }
}

// DELETE /api/products/:id
async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const product = await ProductModel.findById(id, shopId);
    if (!product) return notFoundResponse(res, 'Product');

    // Check if product has been sold — if so, only deactivate
    const hasSales = await ProductModel.hasSalesHistory(id);
    if (hasSales) {
      return errorResponse(
        res,
        'Cannot delete product that has been sold. Deactivate it instead.',
        400
      );
    }

    await ProductModel.delete(id, shopId);
    return successResponse(res, { id }, 'Product deleted');
  } catch (err) {
    console.error('deleteProduct error:', err);
    return errorResponse(res, 'Failed to delete product', 500);
  }
}

// PATCH /api/products/:id/deactivate
async function deactivateProduct(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const product = await ProductModel.findById(id, shopId);
    if (!product) return notFoundResponse(res, 'Product');

    const deactivated = await ProductModel.deactivate(id, shopId);
    return successResponse(res, deactivated, 'Product deactivated');
  } catch (err) {
    console.error('deactivateProduct error:', err);
    return errorResponse(res, 'Failed to deactivate product', 500);
  }
}

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, deactivateProduct };
