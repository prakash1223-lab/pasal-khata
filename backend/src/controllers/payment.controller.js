'use strict';

const { validationResult } = require('express-validator');
const { getClient } = require('../config/db');
const PaymentModel = require('../models/payment.model');
const CustomerModel = require('../models/customer.model');
const { applyPaymentToCustomer } = require('../utils/bakiCalculator');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/responseHelper');

// GET /api/payments
async function getPayments(req, res) {
  try {
    const { startDate, endDate, customerId, page = 1, limit = 20 } = req.query;
    const { shopId } = req.user;

    const { data, total } = await PaymentModel.findAll(shopId, {
      startDate,
      endDate,
      customerId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return paginatedResponse(res, data, total, page, limit, 'Payments retrieved');
  } catch (err) {
    console.error('getPayments error:', err);
    return errorResponse(res, 'Failed to retrieve payments', 500);
  }
}

// POST /api/payments
async function createPayment(req, res) {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { customerId, amount, paymentMethod, note } = req.body;
    const { shopId, userId } = req.user;

    // Validate customer belongs to this shop
    const customer = await CustomerModel.findById(customerId, shopId);
    if (!customer) return notFoundResponse(res, 'Customer');

    const paymentAmount = parseFloat(amount);

    if (paymentAmount <= 0) {
      return errorResponse(res, 'Payment amount must be greater than 0', 400);
    }

    // Warn on overpayment but allow it (flag in response)
    const isOverpayment = paymentAmount > parseFloat(customer.baki);

    // === BEGIN TRANSACTION ===
    await client.query('BEGIN');

    // 1. Insert payment record
    const payment = await PaymentModel.insertPayment(client, {
      shopId,
      customerId,
      receivedBy: userId || null,
      amount: paymentAmount,
      paymentMethod: paymentMethod || 'cash',
      note: note || null,
    });

    // 2. Update customer: reduce baki (never below 0)
    const updatedCustomer = await applyPaymentToCustomer(client, customerId, paymentAmount);

    // === COMMIT ===
    await client.query('COMMIT');

    return successResponse(
      res,
      {
        payment: {
          ...payment,
          customerName: customer.name,
        },
        customerBaki: updatedCustomer.baki,
        isOverpayment,
        overpaymentNote: isOverpayment
          ? `Payment exceeds current baki. ₨ ${(paymentAmount - parseFloat(customer.baki)).toFixed(2)} is advance.`
          : null,
      },
      'Payment recorded successfully',
      201
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createPayment error:', err);
    return errorResponse(res, err.message || 'Failed to record payment', 500);
  } finally {
    client.release();
  }
}

module.exports = { getPayments, createPayment };
