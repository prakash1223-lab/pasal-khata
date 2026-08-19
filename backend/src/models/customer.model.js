'use strict';

const { query } = require('../config/db');

const CustomerModel = {
  async create({ shopId, name, phone, address }) {
    const res = await query(
      `INSERT INTO customers (shop_id, name, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [shopId, name, phone || null, address || null]
    );
    return res.rows[0];
  },

  async findById(id, shopId) {
    const res = await query(
      `SELECT * FROM customers WHERE id = $1 AND shop_id = $2`,
      [id, shopId]
    );
    return res.rows[0] || null;
  },

  async findByPhone(phone, shopId) {
    const res = await query(
      `SELECT * FROM customers WHERE phone = $1 AND shop_id = $2`,
      [phone, shopId]
    );
    return res.rows[0] || null;
  },

  async findAll(shopId, { search = '', page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;

    const countRes = await query(
      `SELECT COUNT(*) FROM customers
       WHERE shop_id = $1 AND (name ILIKE $2 OR phone ILIKE $2)`,
      [shopId, searchParam]
    );

    const dataRes = await query(
      `SELECT id, name, phone, address, total_purchased, total_paid, baki, created_at, updated_at,
              (SELECT MAX(sale_date) FROM sales WHERE customer_id = customers.id) AS last_purchase_date
       FROM customers
       WHERE shop_id = $1 AND (name ILIKE $2 OR phone ILIKE $2)
       ORDER BY baki DESC, name ASC
       LIMIT $3 OFFSET $4`,
      [shopId, searchParam, limit, offset]
    );

    return {
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  async update(id, shopId, { name, phone, address }) {
    const res = await query(
      `UPDATE customers SET name=$1, phone=$2, address=$3, updated_at=NOW()
       WHERE id=$4 AND shop_id=$5
       RETURNING *`,
      [name, phone, address, id, shopId]
    );
    return res.rows[0] || null;
  },

  async delete(id, shopId) {
    const res = await query(
      `DELETE FROM customers WHERE id=$1 AND shop_id=$2 RETURNING id`,
      [id, shopId]
    );
    return res.rows[0] || null;
  },

  // Get combined sales + payments timeline for a customer
  async getTimeline(customerId, shopId) {
    // Use LEFT JOIN so sales with no items still appear
    const salesRes = await query(
      `SELECT s.id, 'sale' AS type, s.sale_date AS date,
              s.total_amount, s.paid_amount, s.baki_amount, s.payment_status, s.notes,
              COALESCE(
                json_agg(json_build_object(
                  'name', si.product_name,
                  'quantity', si.quantity,
                  'unitPrice', si.unit_price,
                  'total', si.total_price
                ) ORDER BY si.created_at) FILTER (WHERE si.id IS NOT NULL),
                '[]'
              ) AS items
       FROM sales s
       LEFT JOIN sale_items si ON si.sale_id = s.id
       WHERE s.customer_id = $1 AND s.shop_id = $2
       GROUP BY s.id
       ORDER BY s.sale_date DESC`,
      [customerId, shopId]
    );

    const paymentsRes = await query(
      `SELECT id, 'payment' AS type, payment_date AS date,
              amount, payment_method, note
       FROM payments
       WHERE customer_id = $1 AND shop_id = $2
       ORDER BY payment_date DESC`,
      [customerId, shopId]
    );

    const timeline = [
      ...salesRes.rows.map(r => ({ ...r, type: 'sale' })),
      ...paymentsRes.rows.map(r => ({ ...r, type: 'payment' })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    return timeline;
  },
};

module.exports = CustomerModel;
