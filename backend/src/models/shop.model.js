'use strict';

const { query } = require('../config/db');

const ShopModel = {
  async create({ name, address, phone }) {
    const res = await query(
      `INSERT INTO shops (name, address, phone)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, address || null, phone || null]
    );
    return res.rows[0];
  },

  async findById(id) {
    const res = await query('SELECT * FROM shops WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async update(id, { name, address, phone }) {
    const res = await query(
      `UPDATE shops SET name=$1, address=$2, phone=$3, updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [name, address, phone, id]
    );
    return res.rows[0] || null;
  },
};

module.exports = ShopModel;
