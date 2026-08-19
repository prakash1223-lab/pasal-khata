'use strict';

const { validationResult } = require('express-validator');
const { getClient } = require('../config/db');
const SaleModel = require('../models/sale.model');
const SaleItemModel = require('../models/saleItem.model');
const ProductModel = require('../models/product.model');
const CustomerModel = require('../models/customer.model');
const { calculateBaki, getPaymentStatus, updateCustomerBalance } = require('../utils/bakiCalculator');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/responseHelper');

// GET /api/sales
async function getSales(req, res) {
  try {
    const { startDate, endDate, customerId, page = 1, limit = 20 } = req.query;
    const { shopId } = req.user;

    const { data, total } = await SaleModel.findAll(shopId, {
      startDate,
      endDate,
      customerId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return paginatedResponse(res, data, total, page, limit, 'Sales retrieved');
  } catch (err) {
    console.error('getSales error:', err);
    return errorResponse(res, 'Failed to retrieve sales', 500);
  }
}

// GET /api/sales/:id
async function getSale(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const sale = await SaleModel.findById(id, shopId);
    if (!sale) return notFoundResponse(res, 'Sale');

    return successResponse(res, sale);
  } catch (err) {
    console.error('getSale error:', err);
    return errorResponse(res, 'Failed to retrieve sale', 500);
  }
}

// POST /api/sales
async function createSale(req, res) {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { customerId, items, paidAmount = 0, notes } = req.body;
    const { shopId, userId } = req.user;

    // --- Validate customer belongs to this shop ---
    const customer = await CustomerModel.findById(customerId, shopId);
    if (!customer) return notFoundResponse(res, 'Customer');

    // --- Validate all products ---
    const resolvedItems = [];
    for (const item of items) {
      const product = await ProductModel.findById(item.productId, shopId);
      if (!product) {
        return errorResponse(res, `Product not found: ${item.productId}`, 400);
      }
      if (product.stock_quantity < item.quantity) {
        return errorResponse(
          res,
          `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, requested: ${item.quantity}`,
          400
        );
      }
      resolvedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice ?? product.price),
      });
    }

    // --- Compute totals ---
    const totalAmount = parseFloat(
      resolvedItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0).toFixed(2)
    );
    const paid = Math.min(parseFloat(paidAmount), totalAmount); // can't pay more than total
    const bakiAmount = calculateBaki(totalAmount, paid);
    const paymentStatus = getPaymentStatus(totalAmount, paid);

    // === BEGIN TRANSACTION ===
    await client.query('BEGIN');

    // 1. Insert sale record
    const saleRes = await client.query(
      `INSERT INTO sales (shop_id, customer_id, created_by, total_amount, paid_amount, baki_amount, payment_status, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [shopId, customerId, userId || null, totalAmount, paid, bakiAmount, paymentStatus, notes || null]
    );
    const sale = saleRes.rows[0];

    // 2. Insert sale items + deduct stock
    const insertedItems = [];
    for (const item of resolvedItems) {
      const saleItem = await SaleItemModel.insertItem(client, {
        saleId: sale.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      });
      insertedItems.push(saleItem);

      // 3. Deduct stock
      await ProductModel.deductStock(client, item.productId, item.quantity);
    }

    // 4. Update customer balance
    const updatedCustomer = await updateCustomerBalance(client, customerId, totalAmount, paid);

    // === COMMIT ===
    await client.query('COMMIT');

    return successResponse(
      res,
      {
        sale: {
          ...sale,
          items: insertedItems,
          customerName: customer.name,
        },
        customerBaki: updatedCustomer.baki,
      },
      'Sale created successfully',
      201
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createSale error:', err);
    return errorResponse(res, err.message || 'Failed to create sale', 500);
  } finally {
    client.release();
  }
}

module.exports = { getSales, getSale, createSale };
