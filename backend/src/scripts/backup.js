'use strict';

const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');
require('dotenv').config();

const pool       = new Pool({ connectionString: process.env.DATABASE_URL });
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../../backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS || '30');

const TABLES = [
  'shops', 'users', 'customers', 'products',
  'suppliers', 'sales', 'sale_items', 'payments',
  'purchases', 'purchase_items', 'supplier_payments',
];

async function createBackup() {
  const timestamp  = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `backup-${timestamp}.json`);

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  console.log(`\n💾 Starting backup at ${new Date().toLocaleString()}\n`);

  const client = await pool.connect();
  try {
    const backup = {
      version:   '1.0',
      createdAt: new Date().toISOString(),
      tables:    {},
    };

    for (const table of TABLES) {
      try {
        const result = await client.query(`SELECT * FROM ${table}`);
        backup.tables[table] = result.rows;
        console.log(`  ✅ ${table}: ${result.rows.length} rows`);
      } catch (err) {
        console.log(`  ⚠️  ${table}: skipped (${err.message})`);
        backup.tables[table] = [];
      }
    }

    // Summary
    const sum = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM customers)                   AS customers,
        (SELECT COUNT(*) FROM sales)                       AS sales,
        (SELECT COUNT(*) FROM payments)                    AS payments,
        (SELECT COALESCE(SUM(baki),0) FROM customers)     AS total_baki,
        (SELECT COALESCE(SUM(total_amount),0) FROM sales) AS total_sales
    `);
    backup.summary = sum.rows[0];

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    const sizeKB = Math.round(fs.statSync(backupFile).size / 1024);

    console.log(`\n✅ Backup saved: ${path.basename(backupFile)}`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Customers: ${backup.summary.customers}`);
    console.log(`   Sales:     ${backup.summary.sales}`);
    console.log(`   Payments:  ${backup.summary.payments}`);

    await cleanOldBackups();
    return backupFile;
  } finally {
    client.release();
  }
}

async function cleanOldBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return;

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length > MAX_BACKUPS) {
    for (const file of files.slice(MAX_BACKUPS)) {
      fs.unlinkSync(file.path);
      console.log(`  🗑️  Deleted old backup: ${file.name}`);
    }
  }
  console.log(`\n📦 Total backups stored: ${Math.min(files.length, MAX_BACKUPS)}`);
}

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) { console.log('No backups found.'); return; }

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .sort().reverse();

  if (files.length === 0) { console.log('No backups found.'); return; }

  console.log(`\n📦 Available backups (${files.length}):\n`);
  files.forEach((f, i) => {
    const sizeKB = Math.round(fs.statSync(path.join(BACKUP_DIR, f)).size / 1024);
    console.log(`  ${i + 1}. ${f} (${sizeKB} KB)`);
  });
}

// Get info about the most recent backup (used by dashboard)
function getLastBackupInfo() {
  if (!fs.existsSync(BACKUP_DIR)) return { exists: false };

  const files = fs.readdirSync(BACKUP_DIR)
    .filter(f => f.startsWith('backup-') && f.endsWith('.json'))
    .map(f => ({
      name: f,
      path: path.join(BACKUP_DIR, f),
      time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime(),
    }))
    .sort((a, b) => b.time - a.time);

  if (files.length === 0) return { exists: false };

  const latest = files[0];
  return {
    exists: true,
    time:   new Date(latest.time).toISOString(),
    sizeKB: Math.round(fs.statSync(latest.path).size / 1024),
    name:   latest.name,
  };
}

module.exports = { createBackup, listBackups, getLastBackupInfo };

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  if (command === 'list') {
    listBackups().finally(() => pool.end());
  } else {
    createBackup().finally(() => pool.end());
  }
}
