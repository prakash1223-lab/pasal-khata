/*
 * PASAL KHATA — DATA MANAGEMENT SCRIPTS
 *
 * 1. See what is in your database:
 *       npm run verify
 *
 * 2. Delete all seed/demo data (keeps shop + users safe):
 *       npm run cleanup
 *    (Type "DELETE" when prompted to confirm)
 *
 *    Skip confirmation (non-interactive / CI use):
 *       npm run cleanup -- --yes
 *
 * 3. After cleanup, start fresh:
 *    - Open the app and log in normally
 *    - Add your real customers, products, suppliers manually
 *    OR
 *    - Edit seed.js with your real data and run: npm run seed
 *
 * 4. If you want to re-seed after cleanup:
 *       npm run cleanup   (first)
 *       npm run seed      (then)
 */

'use strict';

require('dotenv').config();

const { Pool }    = require('pg');
const readline    = require('readline');

const pool   = new Pool({ connectionString: process.env.DATABASE_URL });
const YES    = process.argv.includes('--yes');   // skip interactive prompt

// ── helpers ───────────────────────────────────────────────────────────────────

function ask(question) {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function getShop() {
  // Prefer the shop that actually has users attached (the real active shop).
  // Falls back to oldest shop if none have users (fresh install).
  const result = await pool.query(`
    SELECT id, name, address, phone
    FROM shops
    ORDER BY (SELECT COUNT(*) FROM users u WHERE u.shop_id = shops.id) DESC,
             created_at ASC
    LIMIT 1
  `);
  if (result.rows.length === 0) {
    throw new Error('No shop found in database. Have you run the migrations?');
  }
  return result.rows[0];
}

async function getCounts(shopId) {
  const queries = [
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

  const counts = {};
  for (const { name, q } of queries) {
    try {
      const r      = await pool.query(q, [shopId]);
      counts[name] = parseInt(r.rows[0].count, 10);
    } catch {
      counts[name] = 0;
    }
  }
  return counts;
}

async function cleanupData(shopId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const steps = [
      {
        name: 'sale_items',
        q:    `DELETE FROM sale_items
               WHERE sale_id IN (SELECT id FROM sales WHERE shop_id=$1)`,
      },
      {
        name: 'purchase_items',
        q:    `DELETE FROM purchase_items
               WHERE purchase_id IN (SELECT id FROM purchases WHERE shop_id=$1)`,
      },
      {
        name: 'supplier_payments',
        q:    'DELETE FROM supplier_payments WHERE shop_id=$1',
      },
      {
        name: 'payments',
        q:    'DELETE FROM payments WHERE shop_id=$1',
      },
      {
        name: 'sales',
        q:    'DELETE FROM sales WHERE shop_id=$1',
      },
      {
        name: 'purchases',
        q:    'DELETE FROM purchases WHERE shop_id=$1',
      },
      {
        name: 'customers',
        q:    'DELETE FROM customers WHERE shop_id=$1',
      },
      {
        name: 'suppliers',
        q:    'DELETE FROM suppliers WHERE shop_id=$1',
      },
      {
        name: 'products',
        q:    'DELETE FROM products WHERE shop_id=$1',
      },
    ];

    for (const step of steps) {
      const result = await client.query(step.q, [shopId]);
      console.log(`  ✓ Deleted ${result.rowCount} rows from ${step.name}`);
    }

    await client.query('COMMIT');

    console.log('\n✅ All seed/demo data deleted successfully.');
    console.log('✅ shops, users, zones, and areas are completely untouched.');
    console.log('✅ You can log in and start adding real data right now.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Error during cleanup. All changes rolled back. Database unchanged.');
    console.error('   Error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  try {
    console.log('\n🗑️  PASAL KHATA — SEED DATA CLEANUP');
    console.log('════════════════════════════════════\n');

    console.log('Connecting to database...');
    const shop = await getShop();
    console.log(`Shop found: "${shop.name}" (ID: ${shop.id})\n`);

    // ── What WILL be deleted ─────────────────────────────────────────────────
    console.log('📊 Data that will be DELETED:\n');
    const counts      = await getCounts(shop.id);
    let totalToDelete = 0;

    for (const [table, count] of Object.entries(counts)) {
      const marker = count > 0 ? '🔴' : '⚪';
      console.log(`  ${marker}  ${table.padEnd(20)} ${count} rows`);
      totalToDelete += count;
    }

    // ── What will be KEPT ────────────────────────────────────────────────────
    console.log('\n✅ Data that will be KEPT SAFE:\n');
    const shopCount = await pool.query('SELECT COUNT(*) FROM shops');
    const userCount = await pool.query('SELECT COUNT(*) FROM users WHERE shop_id=$1', [shop.id]);

    console.log(`  ✅  ${'shops'.padEnd(20)} ${shopCount.rows[0].count} rows — UNTOUCHED`);
    console.log(`  ✅  ${'users'.padEnd(20)} ${userCount.rows[0].count} rows — UNTOUCHED`);

    try {
      const zoneCount = await pool.query('SELECT COUNT(*) FROM zones WHERE shop_id=$1', [shop.id]);
      const areaCount = await pool.query('SELECT COUNT(*) FROM areas WHERE shop_id=$1', [shop.id]);
      console.log(`  ✅  ${'zones'.padEnd(20)} ${zoneCount.rows[0].count} rows — UNTOUCHED`);
      console.log(`  ✅  ${'areas'.padEnd(20)} ${areaCount.rows[0].count} rows — UNTOUCHED`);
    } catch {
      // zones/areas may not exist in all setups — skip
    }

    // ── Nothing to delete ────────────────────────────────────────────────────
    if (totalToDelete === 0) {
      console.log('\n✨ Nothing to delete — the database is already clean!');
      console.log('   Add your real data by logging in to the app.\n');
      return;
    }

    // ── Confirmation ─────────────────────────────────────────────────────────
    console.log(`\n⚠️  WARNING: This will permanently delete ${totalToDelete} rows.`);
    console.log('   This action CANNOT be undone.\n');

    if (YES) {
      // Non-interactive mode: --yes flag was passed
      console.log('   --yes flag detected. Skipping confirmation prompt.\n');
    } else {
      const answer = await ask('   Type "DELETE" (all caps) to confirm, or anything else to cancel: ');
      if (answer.trim() !== 'DELETE') {
        console.log('\n❌ Cancelled. Nothing was deleted. Your data is safe.\n');
        return;
      }
    }

    // ── Delete ───────────────────────────────────────────────────────────────
    console.log('\n🗑️  Deleting data...\n');
    await cleanupData(shop.id);

    console.log('\n🎉 Done! Your app is ready for real data.');
    console.log('   Run "npm run verify" to confirm the database is clean.\n');

  } catch (err) {
    console.error('\n💥 Fatal error:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
