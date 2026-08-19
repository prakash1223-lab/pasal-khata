'use strict';

const { validationResult } = require('express-validator');
const { getClient } = require('../config/db');
const PurchaseModel = require('../models/purchase.model');
const SupplierModel = require('../models/supplier.model');
const {
  successResponse, errorResponse, notFoundResponse, paginatedResponse,
} = require('../utils/responseHelper');

async function getPurchases(req, res) {
  try {
    const { startDate, endDate, supplierId, status, page = 1, limit = 20 } = req.query;
    const { shopId } = req.user;
    const { data, total } = await PurchaseModel.findAll(shopId, {
      startDate, endDate, supplierId, status,
      page: parseInt(page), limit: parseInt(limit),
    });
    return paginatedResponse(res, data, total, page, limit, 'Purchases retrieved');
  } catch (err) {
    console.error('getPurchases error:', err);
    return errorResponse(res, 'Failed to retrieve purchases', 500);
  }
}

async function getPurchase(req, res) {
  try {
    const { id } = req.params;
    const { shopId } = req.user;
    const purchase = await PurchaseModel.findById(id, shopId);
    if (!purchase) return notFoundResponse(res, 'Purchase');
    return successResponse(res, purchase);
  } catch (err) {
    console.error('getPurchase error:', err);
    return errorResponse(res, 'Failed to retrieve purchase', 500);
  }
}

async function createPurchase(req, res) {
  const client = await getClient();
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return errorResponse(res, 'Validation failed', 400, errors.array());

    const { supplierId, invoiceNumber, items, paidAmount = 0, notes, purchaseDate } = req.body;
    const { shopId, userId } = req.user;

    const supplier = await SupplierModel.findById(supplierId, shopId);
    if (!supplier) return notFoundResponse(res, 'Supplier');

    if (!items || items.length === 0) return errorResponse(res, 'At least one item is required', 400);

    // Validate products and resolve items
    const resolvedItems = [];
    for (const item of items) {
      if (item.productId) {
        const prodRes = await client.query(
          `SELECT id, name, unit FROM products WHERE id=$1 AND shop_id=$2`,
          [item.productId, shopId]
        );
        if (!prodRes.rows[0]) return errorResponse(res, `Product not found: ${item.productId}`, 400);
        resolvedItems.push({
          productId:   prodRes.rows[0].id,
          productName: item.productName || prodRes.rows[0].name,
          quantity:    parseFloat(item.quantity),
          unit:        item.unit || prodRes.rows[0].unit,
          costPrice:   parseFloat(item.costPrice),
          totalPrice:  parseFloat((item.quantity * item.costPrice).toFixed(2)),
        });
      } else {
        // New product — create it
        const newProd = await client.query(
          `INSERT INTO products (shop_id, name, category, price, stock_quantity, unit, cost_price)
           VALUES ($1,$2,$3,$4,0,$5,$6) RETURNING id, name, unit`,
          [shopId, item.productName, item.category || 'Other', item.costPrice, item.unit || 'piece', item.costPrice]
        );
        resolvedItems.push({
          productId:   newProd.rows[0].id,
          productName: newProd.rows[0].name,
          quantity:    parseFloat(item.quantity),
          unit:        item.unit || 'piece',
          costPrice:   parseFloat(item.costPrice),
          totalPrice:  parseFloat((item.quantity * item.costPrice).toFixed(2)),
        });
      }
    }

    const totalAmount = parseFloat(resolvedItems.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
    const paid        = Math.min(parseFloat(paidAmount) || 0, totalAmount);
    const udharoAmt   = parseFloat((totalAmount - paid).toFixed(2));
    const status      = paid >= totalAmount ? 'paid' : paid === 0 ? 'unpaid' : 'partial';

    await client.query('BEGIN');

    // Insert purchase
    const purchaseRes = await client.query(
      `INSERT INTO purchases
         (shop_id, supplier_id, created_by, invoice_number, total_amount,
          paid_amount, udharo_amount, payment_status, notes, purchase_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [shopId, supplierId, userId || null, invoiceNumber || null,
       totalAmount, paid, udharoAmt, status, notes || null,
       purchaseDate ? new Date(purchaseDate) : new Date()]
    );
    const purchase = purchaseRes.rows[0];

    // Insert items + update stock + cost_price
    const insertedItems = [];
    for (const item of resolvedItems) {
      const piRes = await client.query(
        `INSERT INTO purchase_items
           (purchase_id, product_id, product_name, quantity, unit, cost_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [purchase.id, item.productId, item.productName, item.quantity,
         item.unit, item.costPrice, item.totalPrice]
      );
      insertedItems.push(piRes.rows[0]);

      // Increase stock and update cost price
      await client.query(
        `UPDATE products
         SET stock_quantity = stock_quantity + $1,
             cost_price = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [item.quantity, item.costPrice, item.productId]
      );
    }

    // Update supplier totals
    await client.query(
      `UPDATE suppliers
       SET total_purchased = total_purchased + $1,
           total_paid      = total_paid + $2,
           udharo          = GREATEST(0, udharo + $3),
           updated_at      = NOW()
       WHERE id = $4`,
      [totalAmount, paid, udharoAmt, supplierId]
    );

    // Record payment if any
    if (paid > 0) {
      await client.query(
        `INSERT INTO supplier_payments
           (shop_id, supplier_id, purchase_id, paid_by, amount, payment_method, note, payment_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [shopId, supplierId, purchase.id, userId || null, paid,
         req.body.paymentMethod || 'cash', notes || null,
         purchaseDate ? new Date(purchaseDate) : new Date()]
      );
    }

    await client.query('COMMIT');

    return successResponse(res,
      { purchase: { ...purchase, items: insertedItems, supplierName: supplier.name }, supplierUdharo: udharoAmt },
      'Purchase saved. Stock updated.', 201
    );
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createPurchase error:', err);
    return errorResponse(res, err.message || 'Failed to create purchase', 500);
  } finally {
    client.release();
  }
}

async function payPurchase(req, res) {
  const client = await getClient();
  try {
    const { id } = req.params;
    const { amount, paymentMethod = 'cash', note } = req.body;
    const { shopId, userId } = req.user;

    const purchase = await PurchaseModel.findById(id, shopId);
    if (!purchase) return notFoundResponse(res, 'Purchase');

    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) return errorResponse(res, 'Enter a valid amount', 400);
    if (payAmt > parseFloat(purchase.udharo_amount)) {
      return errorResponse(res, `Amount exceeds remaining उधारो (रु ${parseFloat(purchase.udharo_amount).toLocaleString()})`, 400);
    }

    await client.query('BEGIN');

    const newPaid    = parseFloat(purchase.paid_amount) + payAmt;
    const newUdharo  = Math.max(0, parseFloat(purchase.udharo_amount) - payAmt);
    const newStatus  = newUdharo <= 0 ? 'paid' : 'partial';

    await client.query(
      `UPDATE purchases SET paid_amount=$1, udharo_amount=$2, payment_status=$3 WHERE id=$4`,
      [newPaid, newUdharo, newStatus, id]
    );

    await client.query(
      `UPDATE suppliers
       SET total_paid = total_paid + $1,
           udharo     = GREATEST(0, udharo - $1),
           updated_at = NOW()
       WHERE id = $2`,
      [payAmt, purchase.supplier_id]
    );

    await client.query(
      `INSERT INTO supplier_payments
         (shop_id, supplier_id, purchase_id, paid_by, amount, payment_method, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [shopId, purchase.supplier_id, id, userId || null, payAmt, paymentMethod, note || null]
    );

    await client.query('COMMIT');

    const supplierRes = await client.query(
      `SELECT udharo FROM suppliers WHERE id=$1`, [purchase.supplier_id]
    );

    return successResponse(res, {
      purchaseId:     id,
      paidAmount:     payAmt,
      remainingUdharo: newUdharo,
      supplierUdharo: parseFloat(supplierRes.rows[0]?.udharo || 0),
    }, 'Payment recorded');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('payPurchase error:', err);
    return errorResponse(res, err.message || 'Failed to record payment', 500);
  } finally {
    client.release();
  }
}

module.exports = { getPurchases, getPurchase, createPurchase, payPurchase };
