'use strict';

/**
 * PASAL KHATA — DATABASE VERIFY SCRIPT
 *
 * Read-only. Shows a summary of all current data.
 * No writes, no deletes.
 *
 * Usage: npm run verify
 */

require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  try {
    console.log('\n📊 PASAL KHATA — DATABASE SUMMARY');
    console.log('═══════════════════════════════════\n');

    // ── Shop ─────────────────────────────────────────────────────────────────
    // Prefer the shop that has users (the real active shop)
    const shopRes = await pool.query(`
      SELECT * FROM shops
      ORDER BY (SELECT COUNT(*) FROM users u WHERE u.shop_id = shops.id) DESC,
               created_at ASC
      LIMIT 1
    `);
    if (shopRes.rows.length === 0) {
      console.log('❌ No shop found. Run migrations first.\n');
      return;
    }

    const s = shopRes.rows[0];
    console.log(`🏪 Shop:    ${s.name}`);
    console.log(`   ID:      ${s.id}`);
    console.log(`   Address: ${s.address || '(not set)'}`);
    console.log(`   Phone:   ${s.phone   || '(not set)'}`);

    // ── Users ─────────────────────────────────────────────────────────────────
    const usersRes = await pool.query(
      `SELECT name, email, role, is_active FROM users WHERE shop_id=$1 ORDER BY role, name`,
      [s.id]
    );
    console.log(`\n👤 Users (${usersRes.rows.length}):`);
    for (const u of usersRes.rows) {
      const activeFlag = u.is_active ? '✅' : '⛔';
      console.log(`   ${activeFlag} ${u.name.padEnd(24)} ${u.role.padEnd(8)} ${u.email}`);
    }

    // ── Data counts ───────────────────────────────────────────────────────────
    const tables = [
      { name: 'customers',         q: 'SELECT COUNT(*) FROM customers         WHERE shop_id=$1' },
      { name: 'suppliers',         q: 'SELECT COUNT(*) FROM suppliers         WHERE shop_id=$1' },
      { name: 'products',          q: 'SELECT COUNT(*) FROM products          WHERE shop_id=$1' },
      { name: 'sales',             q: 'SELECT COUNT(*) FROM sales             WHERE shop_id=$1' },
      {
        name: 'sale_items',
        q: `SELECT COUNT(*) FROM sale_items
            WHERE sale_id IN (SELECT id FROM sales WHERE shop_id=$1)`,
      },
      { name: 'payments',          q: 'SELECT COUNT(*) FROM payments          WHERE shop_id=$1' },
      { name: 'purchases',         q: 'SELECT COUNT(*) FROM purchases         WHERE shop_id=$1' },
      {
        name: 'purchase_items',
        q: `SELECT COUNT(*) FROM purchase_items
            WHERE purchase_id IN (SELECT id FROM purchases WHERE shop_id=$1)`,
      },
      { name: 'supplier_payments', q: 'SELECT COUNT(*) FROM supplier_payments WHERE shop_id=$1' },
    ];

    console.log('\n📦 Data counts:');
    for (const { name, q } of tables) {
      try {
        const r     = await pool.query(q, [s.id]);
        const count = parseInt(r.rows[0].count, 10);
        const icon  = count > 0 ? '✅' : '⚪';
        console.log(`   ${icon} ${name.padEnd(20)} ${count}`);
      } catch {
        console.log(`   ❓ ${name.padEnd(20)} table may not exist yet`);
      }
    }

    // zones / areas
    try {
      const zr = await pool.query('SELECT COUNT(*) FROM zones WHERE shop_id=$1', [s.id]);
      const ar = await pool.query('SELECT COUNT(*) FROM areas WHERE shop_id=$1', [s.id]);
      console.log(`   ✅ ${'zones'.padEnd(20)} ${zr.rows[0].count}`);
      console.log(`   ✅ ${'areas'.padEnd(20)} ${ar.rows[0].count}`);
    } catch {
      // zones/areas may not exist — skip silently
    }

    // ── Financial summary ─────────────────────────────────────────────────────
    console.log('\n💰 Financial summary:');

    const bakiRes = await pool.query(
      'SELECT COALESCE(SUM(baki),0) AS total, COUNT(*) FILTER (WHERE baki > 0) AS count FROM customers WHERE shop_id=$1',
      [s.id]
    );
    const udharoRes = await pool.query(
      'SELECT COALESCE(SUM(udharo),0) AS total, COUNT(*) FILTER (WHERE udharo > 0) AS count FROM suppliers WHERE shop_id=$1',
      [s.id]
    );
    const salesRes = await pool.query(
      'SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*) AS count FROM sales WHERE shop_id=$1',
      [s.id]
    );

    const baki   = parseFloat(bakiRes.rows[0].total);
    const udharo = parseFloat(udharoRes.rows[0].total);
    const sales  = parseFloat(salesRes.rows[0].total);

    console.log(`   Total sales revenue:   ₨ ${sales.toLocaleString('en-IN')}`);
    console.log(`   Customer baki owed:    ₨ ${baki.toLocaleString('en-IN')} (${bakiRes.rows[0].count} customers)`);
    console.log(`   Supplier udharo owed:  ₨ ${udharo.toLocaleString('en-IN')} (${udharoRes.rows[0].count} suppliers)`);

    // ── Top baki customers ────────────────────────────────────────────────────
    const topBaki = await pool.query(
      `SELECT name, phone, baki
       FROM customers WHERE shop_id=$1 AND baki > 0
       ORDER BY baki DESC LIMIT 5`,
      [s.id]
    );
    if (topBaki.rows.length > 0) {
      console.log('\n🔴 Top baki customers:');
      for (const c of topBaki.rows) {
        console.log(`   ${c.name.padEnd(24)} ₨ ${parseFloat(c.baki).toLocaleString('en-IN')}`);
      }
    }

    // ── Top supplier udharo ───────────────────────────────────────────────────
    const topUdharo = await pool.query(
      `SELECT name, company_name, udharo
       FROM suppliers WHERE shop_id=$1 AND udharo > 0 AND is_active=true
       ORDER BY udharo DESC LIMIT 5`,
      [s.id]
    );
    if (topUdharo.rows.length > 0) {
      console.log('\n🟡 Top supplier udharo:');
      for (const sup of topUdharo.rows) {
        const label = sup.company_name ? `${sup.name} (${sup.company_name})` : sup.name;
        console.log(`   ${label.padEnd(32)} ₨ ${parseFloat(sup.udharo).toLocaleString('en-IN')}`);
      }
    }

    console.log('\n✅ Done — read-only scan complete. Nothing was modified.\n');

  } catch (err) {
    console.error('\n❌ Error connecting to database:', err.message);
    console.error('   Make sure DATABASE_URL is set in your .env file\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
