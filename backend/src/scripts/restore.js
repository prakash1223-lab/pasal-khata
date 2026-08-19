'use strict';

const { Pool }    = require('pg');
const fs          = require('fs');
const path        = require('path');
const readline    = require('readline');
require('dotenv').config();

const pool       = new Pool({ connectionString: process.env.DATABASE_URL });
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../../backups');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function listAndChooseBackup() {
  if (!fs.existsSync(BACKUP_DIR)) { console.log('No backup directory found.'); return null; }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .sort().reverse();

  if (files.length === 0) { console.log('No backups found.'); return null; }

  console.log('\n📦 Available backups:\n');
  files.forEach((f, i) => {
    const sizeKB = Math.round(fs.statSync(path.join(BACKUP_DIR, f)).size / 1024);
    console.log(`  ${i + 1}. ${f} (${sizeKB} KB)`);
  });

  const choice = await ask('\nEnter backup number to restore (or 0 to cancel): ');
  const index  = parseInt(choice) - 1;
  if (isNaN(index) || index < 0 || index >= files.length) return null;
  return path.join(BACKUP_DIR, files[index]);
}

async function restore(backupFile) {
  console.log(`\n📂 Reading backup: ${path.basename(backupFile)}`);
  const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  console.log(`   Created:   ${data.createdAt}`);
  console.log(`   Customers: ${data.tables.customers?.length || 0}`);
  console.log(`   Sales:     ${data.tables.sales?.length || 0}`);
  console.log(`   Payments:  ${data.tables.payments?.length || 0}`);

  console.log('\n⚠️  WARNING: This will REPLACE ALL current data.');
  console.log('This action CANNOT be undone.\n');

  const confirm = await ask('Type "RESTORE" to confirm: ');
  if (confirm.trim() !== 'RESTORE') { console.log('\n❌ Cancelled.'); return; }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('\n🔄 Restoring data...\n');

    const deleteOrder = [
      'supplier_payments', 'purchase_items', 'sale_items',
      'payments', 'purchases', 'sales',
      'customers', 'suppliers', 'products',
      'users', 'shops',
    ];

    for (const table of deleteOrder) {
      try {
        await client.query(`DELETE FROM ${table}`);
        console.log(`  🗑️  Cleared ${table}`);
      } catch (e) {
        console.log(`  ⚠️  Could not clear ${table}: ${e.message}`);
      }
    }

    const insertOrder = [
      'shops', 'users', 'customers', 'products', 'suppliers',
      'sales', 'sale_items', 'payments',
      'purchases', 'purchase_items', 'supplier_payments',
    ];

    for (const table of insertOrder) {
      const rows = data.tables[table] || [];
      if (rows.length === 0) continue;

      for (const row of rows) {
        const keys        = Object.keys(row);
        const values      = Object.values(row);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const sql = `
          INSERT INTO ${table} (${keys.join(', ')})
          VALUES (${placeholders})
          ON CONFLICT (id) DO NOTHING
        `;
        await client.query(sql, values);
      }
      console.log(`  ✅ Restored ${rows.length} rows → ${table}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Restore completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Restore failed. All changes rolled back.');
    console.error(err.message);
  } finally {
    client.release();
  }
}

async function main() {
  console.log('\n🔄 PASAL KHATA — DATA RESTORE\n');
  const backupFile = await listAndChooseBackup();
  if (backupFile) await restore(backupFile);
  rl.close();
  await pool.end();
}

main();
