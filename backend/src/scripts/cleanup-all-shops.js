'use strict';

/**
 * One-time cleanup: wipe transaction data from ALL shops,
 * then delete orphan shops (shops with no users attached).
 *
 * The real shop (the one with users) keeps its shop record and all users.
 * Run once, then delete this file.
 *
 * Usage:  node src/scripts/cleanup-all-shops.js
 */

require('dotenv').config();

const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  console.log('\n🔍 Scanning all shops...\n');

  try {
    // Show current state
    const shopsRes = await client.query(`
      SELECT
        s.id,
        s.name,
        (SELECT COUNT(*) FROM users     u WHERE u.shop_id = s.id)::int AS users,
        (SELECT COUNT(*) FROM customers c WHERE c.shop_id = s.id)::int AS customers,
        (SELECT COUNT(*) FROM products  p WHERE p.shop_id = s.id)::int AS products,
        (SELECT COUNT(*) FROM sales     sl WHERE sl.shop_id = s.id)::int AS sales,
        (SELECT COUNT(*) FROM suppliers su WHERE su.shop_id = s.id)::int AS suppliers
      FROM shops s
      ORDER BY s.created_at
    `);

    console.log('Shops found:\n');
    for (const row of shopsRes.rows) {
      const label = row.users > 0 ? '✅ REAL SHOP (has users)' : '🗑️  ORPHAN (no users)';
      console.log(`  ${label}`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Customers: ${row.customers}  Products: ${row.products}  Sales: ${row.sales}  Suppliers: ${row.suppliers}\n`);
    }

    await client.query('BEGIN');

    // Step 1 — Wipe transaction data from every shop
    for (const row of shopsRes.rows) {
      const id = row.id;

      const si  = await client.query('DELETE FROM sale_items     WHERE sale_id     IN (SELECT id FROM sales     WHERE shop_id=$1)', [id]);
      const pi  = await client.query('DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE shop_id=$1)', [id]);
      const sp  = await client.query('DELETE FROM supplier_payments WHERE shop_id=$1', [id]);
      const py  = await client.query('DELETE FROM payments            WHERE shop_id=$1', [id]);
      const sl  = await client.query('DELETE FROM sales               WHERE shop_id=$1', [id]);
      const pu  = await client.query('DELETE FROM purchases            WHERE shop_id=$1', [id]);
      const cu  = await client.query('DELETE FROM customers            WHERE shop_id=$1', [id]);
      const su  = await client.query('DELETE FROM suppliers            WHERE shop_id=$1', [id]);
      const pr  = await client.query('DELETE FROM products             WHERE shop_id=$1', [id]);

      const total = si.rowCount + pi.rowCount + sp.rowCount + py.rowCount +
                    sl.rowCount + pu.rowCount + cu.rowCount + su.rowCount + pr.rowCount;

      console.log(`  ✓ Wiped ${total} rows from shop ${id.slice(0, 8)}...`);
    }

    // Step 2 — Delete orphan shops (no users)
    const orphanDel = await client.query(`
      DELETE FROM shops
      WHERE id NOT IN (
        SELECT DISTINCT shop_id FROM users WHERE shop_id IS NOT NULL
      )
      RETURNING id, name
    `);

    if (orphanDel.rowCount > 0) {
      console.log(`\n  ✓ Deleted ${orphanDel.rowCount} orphan shop(s):`);
      for (const s of orphanDel.rows) {
        console.log(`    - ${s.name} (${s.id})`);
      }
    } else {
      console.log('\n  ℹ️  No orphan shops to delete.');
    }

    await client.query('COMMIT');

    console.log('\n✅ All done!\n');

    // Final state
    const finalShops = await client.query(`
      SELECT s.id, s.name,
        (SELECT COUNT(*) FROM users u WHERE u.shop_id = s.id)::int AS users,
        (SELECT COUNT(*) FROM customers c WHERE c.shop_id = s.id)::int AS customers
      FROM shops s ORDER BY s.created_at
    `);

    console.log('Remaining shops:\n');
    for (const row of finalShops.rows) {
      console.log(`  🏪 ${row.name}`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Users: ${row.users}  Customers: ${row.customers}\n`);
    }

    console.log('✅ shops and users are intact.');
    console.log('✅ All transaction data is gone.');
    console.log('✅ App is ready for real data.\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error — rolled back. Nothing changed.');
    console.error('   ', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
