'use strict';

const db = require('../config/db');

/**
 * Log an activity to the activity_log table.
 * Failures are silently caught — logging must never break the main flow.
 */
async function logActivity({
  shopId,
  userId,
  userName,
  action,
  tableName  = null,
  recordId   = null,
  oldData    = null,
  newData    = null,
  ipAddress  = null,
}) {
  try {
    await db.query(
      `INSERT INTO activity_log
         (shop_id, user_id, user_name, action, table_name, record_id, old_data, new_data, ip_address)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        shopId,
        userId    || null,
        userName  || null,
        action,
        tableName || null,
        recordId  || null,
        oldData   ? JSON.stringify(oldData)  : null,
        newData   ? JSON.stringify(newData)  : null,
        ipAddress || null,
      ]
    );
  } catch (err) {
    // Never crash main flow because of logging
    console.error('Activity log error:', err.message);
  }
}

module.exports = { logActivity };
