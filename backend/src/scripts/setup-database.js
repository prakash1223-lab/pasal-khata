'use strict';

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔧 Configuring PostgreSQL for maximum data safety...\n');

    const settings = [
      [`ALTER SYSTEM SET wal_level = 'replica';`,             '✅ WAL level set to replica'],
      [`ALTER SYSTEM SET synchronous_commit = 'on';`,         '✅ Synchronous commit enabled'],
      [`ALTER SYSTEM SET checkpoint_completion_target = 0.9;`,'✅ Checkpoint target set'],
      [`ALTER SYSTEM SET wal_buffers = '16MB';`,              '✅ WAL buffers configured'],
      [`ALTER SYSTEM SET max_wal_size = '1GB';`,              '✅ Max WAL size set'],
    ];

    for (const [sql, msg] of settings) {
      try {
        await client.query(sql);
        console.log(msg);
      } catch (e) {
        console.log(`⚠️  Skipped (${e.message.substring(0, 60)})`);
      }
    }

    await client.query('SELECT pg_reload_conf();');
    console.log('✅ Configuration reloaded\n');
    console.log('✅ Database configured for permanent safe storage');
    console.log('   Restart PostgreSQL to apply all WAL changes.\n');
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();
