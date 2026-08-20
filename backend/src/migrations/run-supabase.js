'use strict';

/**
 * Supabase migration runner.
 * Safe to run multiple times — skips already-applied migrations.
 * Used as the Render.com build command: node src/migrations/run-supabase.js
 */

const { query, pool } = require('../config/db');
const fs   = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
  console.log('\n📦 Running Supabase migrations...\n');
  try {
    // Ensure migration tracking table exists
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id           SERIAL PRIMARY KEY,
        filename     VARCHAR(255) UNIQUE NOT NULL,
        executed_at  TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✅ Migration tracking table ready');

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log('⚠️  No migrations folder found at:', MIGRATIONS_DIR);
      return;
    }

    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      console.log('✅ No migration files found');
      return;
    }

    for (const file of files) {
      try {
        // Skip if already ran
        const existing = await query(
          'SELECT id FROM _migrations WHERE filename = $1',
          [file]
        );
        if (existing.rows.length > 0) {
          console.log(`⏭️  Already ran: ${file}`);
          continue;
        }

        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
        // Run each statement separately — PgBouncer transaction pooler
        // doesn't support multi-statement transactions in migration scripts
        await query(sql);
        await query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        console.log(`✅ Ran: ${file}`);
      } catch (err) {
        // Table/index already exists — record it and continue
        if (
          err.message.includes('already exists') ||
          err.message.includes('duplicate')
        ) {
          console.log(`⚠️  ${file}: already exists — recording and continuing`);
          await query(
            'INSERT INTO _migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING',
            [file]
          ).catch(() => {});
        } else {
          console.error(`❌ Failed: ${file} — ${err.message}`);
          throw err;
        }
      }
    }

    console.log('\n✅ All migrations complete\n');
  } catch (err) {
    console.error('Migration error:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Fatal migration error:', err.message);
  process.exit(1);
});
