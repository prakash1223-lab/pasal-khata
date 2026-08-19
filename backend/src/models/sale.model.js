'use strict';

const { query } = require('../config/db');

const SaleModel = {
  async findById(id, shopId) {
    const saleRes = await query(
      `SELECT s.*, c.name AS customer_name, c.phone AS customer_phone,
              u.name AS created_by_name
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN users u ON u.id = s.created_by
       WHERE s.id = $1 AND s.shop_id = $2`,
      [id, shopId]
    );
    if (!saleRes.rows[0]) return null;
    const sale = saleRes.rows[0];

    const itemsRes = await query(
      `SELECT * FROM sale_items WHERE sale_id = $1 ORDER BY created_at`,
      [id]
    );
    sale.items = itemsRes.rows;
    return sale;
  },

  async findAll(shopId, { startDate, endDate, customerId, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const params = [shopId];
    let whereExtra = '';

    if (startDate) {
      params.push(startDate);
      whereExtra += ` AND s.sale_date::date >= $${params.length}::date`;
    }
    if (endDate) {
      params.push(endDate);
      whereExtra += ` AND s.sale_date::date <= $${params.length}::date`;
    }
    if (customerId) {
      params.push(customerId);
      whereExtra += ` AND s.customer_id = $${params.length}`;
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM sales s WHERE s.shop_id = $1 ${whereExtra}`,
      params
    );

    const dataRes = await query(
      `SELECT s.id, s.shop_id, s.customer_id, s.total_amount, s.paid_amount, s.baki_amount, s.payment_status,
              s.notes, s.sale_date, s.created_at,
              c.name AS customer_name, c.phone AS customer_phone,
              (SELECT COUNT(*) FROM sale_items si WHERE si.sale_id = s.id) AS items_count
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.shop_id = $1 ${whereExtra}
       ORDER BY s.sale_date DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count, 10),
    };
  },
};

module.exports = SaleModel;
