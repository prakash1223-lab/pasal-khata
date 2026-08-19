'use strict';

const { query } = require('../config/db');

const SupplierModel = {
  async create({ shopId, name, companyName, phone, address, email, notes }) {
    const res = await query(
      `INSERT INTO suppliers (shop_id, name, company_name, phone, address, email, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [shopId, name, companyName || null, phone || null, address || null, email || null, notes || null]
    );
    return res.rows[0];
  },

  async findAll(shopId, { search = '', page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const s = `%${search}%`;
    const countRes = await query(
      `SELECT COUNT(*) FROM suppliers
       WHERE shop_id=$1 AND is_active=true
         AND (name ILIKE $2 OR company_name ILIKE $2 OR phone ILIKE $2)`,
      [shopId, s]
    );
    const dataRes = await query(
      `SELECT id, name, company_name, phone, address, email,
              total_purchased, total_paid, udharo, is_active, created_at,
              (SELECT MAX(purchase_date) FROM purchases p WHERE p.supplier_id = suppliers.id) AS last_purchase_date
       FROM suppliers
       WHERE shop_id=$1 AND is_active=true
         AND (name ILIKE $2 OR company_name ILIKE $2 OR phone ILIKE $2)
       ORDER BY udharo DESC
       LIMIT $3 OFFSET $4`,
      [shopId, s, limit, offset]
    );
    return { data: dataRes.rows, total: parseInt(countRes.rows[0].count, 10) };
  },

  async findById(id, shopId) {
    const res = await query(
      `SELECT * FROM suppliers WHERE id=$1 AND shop_id=$2`,
      [id, shopId]
    );
    return res.rows[0] || null;
  },

  async update(id, shopId, { name, companyName, phone, address, email, notes, isActive }) {
    const res = await query(
      `UPDATE suppliers
       SET name=$1, company_name=$2, phone=$3, address=$4, email=$5,
           notes=$6, is_active=$7, updated_at=NOW()
       WHERE id=$8 AND shop_id=$9 RETURNING *`,
      [name, companyName || null, phone || null, address || null,
       email || null, notes || null, isActive !== false, id, shopId]
    );
    return res.rows[0] || null;
  },

  async softDelete(id, shopId) {
    const res = await query(
      `UPDATE suppliers SET is_active=false, updated_at=NOW()
       WHERE id=$1 AND shop_id=$2 RETURNING id`,
      [id, shopId]
    );
    return res.rows[0] || null;
  },

  async getTimeline(id, shopId) {
    const purchasesRes = await query(
      `SELECT p.id, 'purchase' AS type, p.purchase_date AS date,
              p.total_amount, p.paid_amount, p.udharo_amount, p.payment_status,
              p.invoice_number, p.notes,
              (SELECT json_agg(json_build_object(
                 'name', pi.product_name, 'qty', pi.quantity,
                 'unit', pi.unit, 'cost_price', pi.cost_price,
                 'total', pi.total_price))
               FROM purchase_items pi WHERE pi.purchase_id = p.id) AS items
       FROM purchases p
       WHERE p.supplier_id=$1 AND p.shop_id=$2
       ORDER BY p.purchase_date DESC`,
      [id, shopId]
    );
    const paymentsRes = await query(
      `SELECT sp.id, 'payment' AS type, sp.payment_date AS date,
              sp.amount, sp.payment_method, sp.note
       FROM supplier_payments sp
       WHERE sp.supplier_id=$1 AND sp.shop_id=$2
       ORDER BY sp.payment_date DESC`,
      [id, shopId]
    );
    const all = [
      ...purchasesRes.rows.map(r => ({ ...r, type: 'purchase' })),
      ...paymentsRes.rows.map(r => ({ ...r, type: 'payment' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    return all;
  },
};

module.exports = SupplierModel;
