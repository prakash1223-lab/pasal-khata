'use strict';

const { query } = require('../config/db');

const UserModel = {
  async create({ shopId, name, email, phone, passwordHash, role = 'staff' }) {
    const res = await query(
      `INSERT INTO users (shop_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, shop_id, name, email, phone, role, is_active, created_at`,
      [shopId, name, email || null, phone || null, passwordHash, role]
    );
    return res.rows[0];
  },

  async findByEmail(email) {
    const res = await query(
      `SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true`,
      [email]
    );
    return res.rows[0] || null;
  },

  async findById(id) {
    const res = await query(
      `SELECT id, shop_id, name, email, phone, role, is_active, created_at
       FROM users WHERE id = $1`,
      [id]
    );
    return res.rows[0] || null;
  },

  async findByShopId(shopId) {
    const res = await query(
      `SELECT id, shop_id, name, email, phone, role, is_active, created_at
       FROM users WHERE shop_id = $1 AND is_active = true ORDER BY created_at`,
      [shopId]
    );
    return res.rows;
  },

  async updatePassword(id, passwordHash) {
    const res = await query(
      `UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2 RETURNING id`,
      [passwordHash, id]
    );
    return res.rows[0] || null;
  },

  async deactivate(id) {
    const res = await query(
      `UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1 RETURNING id`,
      [id]
    );
    return res.rows[0] || null;
  },
};

module.exports = UserModel;
