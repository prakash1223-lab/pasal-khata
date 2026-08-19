'use strict';

const { query } = require('../config/db');

function getStockStatus(qty) {
  if (qty <= 0) return 'out_of_stock';
  if (qty <= 10) return 'low_stock';
  return 'in_stock';
}

const ProductModel = {
  async create({ shopId, name, category, price, stockQuantity, unit, costPrice }) {
    const res = await query(
      `INSERT INTO products (shop_id, name, category, price, stock_quantity, unit, cost_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [shopId, name, category || null, price, stockQuantity || 0, unit || 'piece', costPrice || null]
    );
    const row = res.rows[0];
    return { ...row, stock_status: getStockStatus(row.stock_quantity) };
  },

  async findById(id, shopId) {
    const res = await query(
      `SELECT * FROM products WHERE id = $1 AND shop_id = $2 AND is_active = true`,
      [id, shopId]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return { ...row, stock_status: getStockStatus(row.stock_quantity) };
  },

  async findAll(shopId, { search = '', category = '', page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const searchParam = `%${search}%`;

    let whereClause = `shop_id = $1 AND is_active = true AND (name ILIKE $2)`;
    const params = [shopId, searchParam];

    if (category) {
      whereClause += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    const countRes = await query(
      `SELECT COUNT(*) FROM products WHERE ${whereClause}`,
      params
    );

    const dataRes = await query(
      `SELECT * FROM products WHERE ${whereClause}
       ORDER BY name ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    return {
      data: dataRes.rows.map(r => ({ ...r, stock_status: getStockStatus(r.stock_quantity) })),
      total: parseInt(countRes.rows[0].count, 10),
    };
  },

  async update(id, shopId, { name, category, price, stockQuantity, unit, costPrice }) {
    const res = await query(
      `UPDATE products
       SET name=$1, category=$2, price=$3, stock_quantity=$4, unit=$5,
           cost_price=COALESCE($6, cost_price), updated_at=NOW()
       WHERE id=$7 AND shop_id=$8
       RETURNING *`,
      [name, category, price, stockQuantity, unit, costPrice ?? null, id, shopId]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return { ...row, stock_status: getStockStatus(row.stock_quantity) };
  },

  async deactivate(id, shopId) {
    const res = await query(
      `UPDATE products SET is_active=false, updated_at=NOW()
       WHERE id=$1 AND shop_id=$2 RETURNING id, name`,
      [id, shopId]
    );
    return res.rows[0] || null;
  },

  async delete(id, shopId) {
    const res = await query(
      `DELETE FROM products WHERE id=$1 AND shop_id=$2 RETURNING id`,
      [id, shopId]
    );
    return res.rows[0] || null;
  },

  async hasSalesHistory(id) {
    const res = await query(
      `SELECT COUNT(*) FROM sale_items WHERE product_id = $1`,
      [id]
    );
    return parseInt(res.rows[0].count, 10) > 0;
  },

  // Deduct stock — used inside a transaction client
  async deductStock(client, productId, quantity) {
    const res = await client.query(
      `UPDATE products
       SET stock_quantity = stock_quantity - $1, updated_at=NOW()
       WHERE id = $2
       RETURNING id, name, stock_quantity`,
      [quantity, productId]
    );
    return res.rows[0] || null;
  },
};

module.exports = ProductModel;
