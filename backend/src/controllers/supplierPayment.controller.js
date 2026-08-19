'use strict';

const { getClient, query } = require('../config/db');
const {
  successResponse, errorResponse, paginatedResponse,
} = require('../utils/responseHelper');

async function getSupplierPayments(req, res) {
  try {
    const { startDate, endDate, supplierId, page = 1, limit = 20 } = req.query;
    const { shopId } = req.user;
    const params = [shopId];
    let where = '';
    if (startDate) { params.push(startDate); where += ` AND sp.payment_date::date >= $${params.length}::date`; }
    if (endDate)   { params.push(endDate);   where += ` AND sp.payment_date::date <= $${params.length}::date`; }
    if (supplierId){ params.push(supplierId); where += ` AND sp.supplier_id = $${params.length}`; }

    const countRes = await query(
      `SELECT COUNT(*) FROM supplier_payments sp WHERE sp.shop_id=$1 ${where}`, params
    );
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const dataRes = await query(
      `SELECT sp.id, sp.amount, sp.payment_method, sp.note, sp.payment_date,
              s.name AS supplier_name, s.company_name
       FROM supplier_payments sp
       LEFT JOIN suppliers s ON s.id = sp.supplier_id
       WHERE sp.shop_id=$1 ${where}
       ORDER BY sp.payment_date DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    return paginatedResponse(res, dataRes.rows, parseInt(countRes.rows[0].count), page, limit, 'Supplier payments retrieved');
  } catch (err) {
    console.error('getSupplierPayments error:', err);
    return errorResponse(res, 'Failed to retrieve supplier payments', 500);
  }
}

async function createSupplierPayment(req, res) {
  const client = await getClient();
  try {
    const { supplierId, amount, paymentMethod = 'cash', note } = req.body;
    const { shopId, userId } = req.user;

    const payAmt = parseFloat(amount);
    if (!payAmt || payAmt <= 0) return errorResponse(res, 'Enter a valid amount', 400);

    const supRes = await client.query(
      `SELECT * FROM suppliers WHERE id=$1 AND shop_id=$2`, [supplierId, shopId]
    );
    const supplier = supRes.rows[0];
    if (!supplier) return errorResponse(res, 'Supplier not found', 404);

    await client.query('BEGIN');

    await client.query(
      `INSERT INTO supplier_payments (shop_id, supplier_id, paid_by, amount, payment_method, note)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [shopId, supplierId, userId || null, payAmt, paymentMethod, note || null]
    );

    const updRes = await client.query(
      `UPDATE suppliers
       SET total_paid = total_paid + $1,
           udharo     = GREATEST(0, udharo - $1),
           updated_at = NOW()
       WHERE id=$2 RETURNING udharo`,
      [payAmt, supplierId]
    );

    await client.query('COMMIT');

    return successResponse(res, {
      supplierId,
      paidAmount: payAmt,
      supplierUdharo: parseFloat(updRes.rows[0].udharo),
    }, 'Payment recorded', 201);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createSupplierPayment error:', err);
    return errorResponse(res, 'Failed to record payment', 500);
  } finally {
    client.release();
  }
}

module.exports = { getSupplierPayments, createSupplierPayment };
