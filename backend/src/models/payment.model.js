'use strict';

const { query } = require('../config/db');

const PaymentModel = {
  async findAll(shopId, { startDate, endDate, customerId, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [shopId];
    let whereExtra = '';

    if (startDate) {
      params.push(startDate);
      whereExtra += ` AND p.payment_date::date >= $${params.length}::date`;
    }
    if (endDate) {
      params.push(endDate);
      whereExtra += ` AND p.payment_date::date <= $${params.length}::date`;
    }
    if (customerId) {
      params.push(customerId);
      whereExtra += ` AND p.customer_id = $${params.length}`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM payments p WHERE p.shop_id = $1 ${whereExtra}`,
      params
    );

    const dataRes = await query(
      `SELECT p.id, p.shop_id, p.customer_id, p.amount, p.payment_method, p.note, p.payment_date, p.created_at,
              c.name AS customer_name, c.phone AS customer_phone,
              u.name AS received_by_name
       FROM payments p
       LEFT JOIN customers c ON c.id = p.customer_id
       LEFT JOIN users u ON u.id = p.received_by
       WHERE p.shop_id = $1 ${whereExtra}
       ORDER BY p.payment_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  // Insert inside a transaction client
  async insertPayment(client, { shopId, customerId, receivedBy, amount, paymentMethod, note }) {
    const res = await client.query(
      `INSERT INTO payments (shop_id, customer_id, received_by, amount, payment_method, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [shopId, customerId, receivedBy || null, amount, paymentMethod || 'cash', note || null]
    );
    return res.rows[0];
  },
};

module.exports = PaymentModel;
