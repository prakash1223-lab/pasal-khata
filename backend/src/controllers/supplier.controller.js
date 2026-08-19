'use strict';

const { validationResult } = require('express-validator');
const SupplierModel = require('../models/supplier.model');
const {
  successResponse, errorResponse, notFoundResponse, paginatedResponse,
} = require('../utils/responseHelper');

async function getSuppliers(req, res) {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    const { shopId } = req.user;
    const { data, total } = await SupplierModel.findAll(shopId, {
      search, page: parseInt(page), limit: parseInt(limit),
    });
    return paginatedResponse(res, data, total, page, limit, 'Suppliers retrieved');
  } catch (err) {
    console.error('getSuppliers error:', err);
    return errorResponse(res, 'Failed to retrieve suppliers', 500);
  }
}

async function getSupplier(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;
    const supplier = await SupplierModel.findById(id, shopId);
    if (!supplier) return notFoundResponse(res, 'Supplier');
    return successResponse(res, supplier);
  } catch (err) {
    console.error('getSupplier error:', err);
    return errorResponse(res, 'Failed to retrieve supplier', 500);
  }
}

async function getSupplierTransactions(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;
    const supplier = await SupplierModel.findById(id, shopId);
    if (!supplier) return notFoundResponse(res, 'Supplier');
    const timeline = await SupplierModel.getTimeline(id, shopId);
    return successResponse(res, { supplier, timeline });
  } catch (err) {
    console.error('getSupplierTransactions error:', err);
    return errorResponse(res, 'Failed to retrieve transactions', 500);
  }
}

async function createSupplier(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());
    const { name, company_name, phone, address, email, notes } = req.body;
    const { shopId } = req.user;
    const supplier = await SupplierModel.create({ shopId, name, companyName: company_name, phone, address, email, notes });
    return successResponse(res, supplier, 'Supplier created', 201);
  } catch (err) {
    console.error('createSupplier error:', err);
    return errorResponse(res, 'Failed to create supplier', 500);
  }
}

async function updateSupplier(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;
    const existing = await SupplierModel.findById(id, shopId);
    if (!existing) return notFoundResponse(res, 'Supplier');
    const { name, company_name, phone, address, email, notes, is_active } = req.body;
    const updated = await SupplierModel.update(id, shopId, {
      name: name || existing.name,
      companyName: company_name !== undefined ? company_name : existing.company_name,
      phone: phone || existing.phone,
      address: address !== undefined ? address : existing.address,
      email: email !== undefined ? email : existing.email,
      notes: notes !== undefined ? notes : existing.notes,
      isActive: is_active !== undefined ? is_active : existing.is_active,
    });
    return successResponse(res, updated, 'Supplier updated');
  } catch (err) {
    console.error('updateSupplier error:', err);
    return errorResponse(res, 'Failed to update supplier', 500);
  }
}

async function deleteSupplier(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;
    const supplier = await SupplierModel.findById(id, shopId);
    if (!supplier) return notFoundResponse(res, 'Supplier');
    if (parseFloat(supplier.udharo) > 0) {
      return errorResponse(
        res,
        `Cannot delete supplier with outstanding उधारो of रु ${parseFloat(supplier.udharo).toLocaleString('en-IN')}. Clear the balance first.`,
        400
      );
    }
    await SupplierModel.softDelete(id, shopId);
    return successResponse(res, { id }, 'Supplier deleted');
  } catch (err) {
    console.error('deleteSupplier error:', err);
    return errorResponse(res, 'Failed to delete supplier', 500);
  }
}

module.exports = { getSuppliers, getSupplier, getSupplierTransactions, createSupplier, updateSupplier, deleteSupplier };
