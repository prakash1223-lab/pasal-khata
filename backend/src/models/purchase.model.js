'use strict';

const { query } = require('../config/db');

const PurchaseModel = {
  async findAll(shopId, { startDate, endDate, supplierId, status, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [shopId];
    let where = '';

    if (startDate) { params.push(startDate); where += ` AND p.purchase_date::date >= $${params.length}::date`; }
    if (endDate)   { params.push(endDate);   where += ` AND p.purchase_date::date <= $${params.length}::date`; }
    if (supplierId){ params.push(supplierId); where += ` AND p.supplier_id = $${params.length}`; }
    if (status)    { params.push(status);     where += ` AND p.payment_status = $${params.length}`; }

    const countRes = await query(
      `SELECT COUNT(*) FROM purchases p WHERE p.shop_id=$1 ${where}`, params
    );
    const dataRes = await query(
      `SELECT p.id, p.supplier_id, p.total_amount, p.paid_amount, p.udharo_amount,
              p.payment_status, p.invoice_number, p.notes, p.purchase_date,
              s.name AS supplier_name, s.company_name,
              (SELECT COUNT(*) FROM purchase_items pi WHERE pi.purchase_id=p.id)::int AS items_count
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE p.shop_id=$1 ${where}
       ORDER BY p.purchase_date DESC
       LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, limit, offset]
    );
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
  },

  async findById(id, shopId) {
    const purchaseRes = await query(
      `SELECT p.*, s.name AS supplier_name, s.company_name, s.phone AS supplier_phone
       FROM purchases p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE p.id=$1 AND p.shop_id=$2`,
      [id, shopId]
    );
    if (!purchaseRes.rows[0]) return null;
    const purchase = purchaseRes.rows[0];
    const itemsRes = await query(
      `SELECT * FROM purchase_items WHERE purchase_id=$1 ORDER BY created_at`, [id]
    );
    purchase.items = itemsRes.rows;
    return purchase;
  },
};

module.exports = PurchaseModel;
