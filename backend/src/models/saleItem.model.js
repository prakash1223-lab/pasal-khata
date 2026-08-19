'use strict';

const SaleItemModel = {
  // Sale items are always created inside transactions via the sale controller.
  // This model provides the insert helper that accepts a client.
  async insertItem(client, { saleId, productId, productName, quantity, unitPrice }) {
    const totalPrice = parseFloat((quantity * unitPrice).toFixed(2));
    const res = await client.query(
      `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [saleId, productId || null, productName, quantity, unitPrice, totalPrice]
    );
    return res.rows[0];
  },
};

module.exports = SaleItemModel;
