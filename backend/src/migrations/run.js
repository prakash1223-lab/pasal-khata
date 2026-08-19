'use strict';

/**
 * Migration runner — reads all SQL files from /migrations in order
 * and executes them against the database.
 *
 * Usage: node src/migrations/run.js
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function runMigrations() {
  const client = await pool.connect();
  console.log('✅ Connected to database');

  try {
    // Create migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id          SERIAL PRIMARY KEY,
        filename    VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT NOW()
      )
    `);

    const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      // Skip if already run
      const already = await client.query(
        'SELECT id FROM _migrations WHERE filename = $1',
        [file]
      );
      if (already.rowCount > 0) {
        console.log(`⏭  Skipping (already run): ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query(
          'INSERT INTO _migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✅ Migrated: ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed migration: ${file}`);
        console.error(err.message);
        process.exit(1);
      }
    }

    console.log('\n🎉 All migrations complete!\n');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration runner error:', err);
  process.exit(1);
});
