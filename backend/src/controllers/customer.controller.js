'use strict';

const { validationResult } = require('express-validator');
const CustomerModel = require('../models/customer.model');
const {
  successResponse,
  errorResponse,
  notFoundResponse,
  paginatedResponse,
} = require('../utils/responseHelper');

// GET /api/customers
async function getCustomers(req, res) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const { shopId } = req.user;

    const { data, total } = await CustomerModel.findAll(shopId, {
      search,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
    });

    return paginatedResponse(res, data, total, page, limit, 'Customers retrieved');
  } catch (err) {
    console.error('getCustomers error:', err);
    return errorResponse(res, 'Failed to retrieve customers', 500);
  }
}

// GET /api/customers/:id
async function getCustomer(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const customer = await CustomerModel.findById(id, shopId);
    if (!customer) return notFoundResponse(res, 'Customer');

    return successResponse(res, customer);
  } catch (err) {
    console.error('getCustomer error:', err);
    return errorResponse(res, 'Failed to retrieve customer', 500);
  }
}

// GET /api/customers/:id/transactions
async function getCustomerTransactions(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const customer = await CustomerModel.findById(id, shopId);
    if (!customer) return notFoundResponse(res, 'Customer');

    const timeline = await CustomerModel.getTimeline(id, shopId);

    return successResponse(res, {
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        baki: customer.baki,
        totalPurchased: customer.total_purchased,
        totalPaid: customer.total_paid,
      },
      timeline,
    });
  } catch (err) {
    console.error('getCustomerTransactions error:', err);
    return errorResponse(res, 'Failed to retrieve transactions', 500);
  }
}

// POST /api/customers
async function createCustomer(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { name, phone, address } = req.body;
    const { shopId } = req.user;

    // Check for duplicate phone in same shop
    if (phone) {
      const existing = await CustomerModel.findByPhone(phone, shopId);
      if (existing) {
        return errorResponse(res, `Phone ${phone} is already registered to ${existing.name}.`, 409);
      }
    }

    const customer = await CustomerModel.create({ shopId, name, phone, address });
    return successResponse(res, customer, 'Customer created', 201);
  } catch (err) {
    console.error('createCustomer error:', err);
    return errorResponse(res, 'Failed to create customer', 500);
  }
}

// PUT /api/customers/:id
async function updateCustomer(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, 'Validation failed', 400, errors.array());
    }

    const { id } = req.params;
    const { name, phone, address } = req.body;
    const { shopId } = req.user;

    const existing = await CustomerModel.findById(id, shopId);
    if (!existing) return notFoundResponse(res, 'Customer');

    const updated = await CustomerModel.update(id, shopId, { name, phone, address });
    return successResponse(res, updated, 'Customer updated');
  } catch (err) {
    console.error('updateCustomer error:', err);
    return errorResponse(res, 'Failed to update customer', 500);
  }
}

// DELETE /api/customers/:id
async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;

    const customer = await CustomerModel.findById(id, shopId);
    if (!customer) return notFoundResponse(res, 'Customer');

    if (parseFloat(customer.baki) > 0) {
      return errorResponse(
        res,
        `Cannot delete customer with outstanding baki of ₨ ${parseFloat(customer.baki).toLocaleString('en-IN')}`,
        400
      );
    }

    await CustomerModel.delete(id, shopId);
    return successResponse(res, { id }, 'Customer deleted');
  } catch (err) {
    console.error('deleteCustomer error:', err);
    return errorResponse(res, 'Failed to delete customer', 500);
  }
}

module.exports = {
  getCustomers,
  getCustomer,
  getCustomerTransactions,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
