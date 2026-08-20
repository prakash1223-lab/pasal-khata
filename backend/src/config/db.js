'use strict';

const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('connect', () => {
  // silent on every connection — too noisy
});

pool.on('error', (err) => {
  console.error('❌ Database pool error:', err.message);
});

async function testConnection() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() as time');
    console.log('✅ Database connected at:', result.rows[0].time);
    return true;
  } catch (err) {
    console.error('❌ Connection test failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 2000) {
      console.warn('⚠️ Slow query:', { duration: duration + 'ms', text: text.substring(0, 80) });
    }
    return result;
  } catch (err) {
    console.error('❌ Query error:', { message: err.message, query: text.substring(0, 80) });
    throw err;
  }
}

async function getClient() {
  const client          = await pool.connect();
  const originalQuery   = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };

  const timeout = setTimeout(() => {
    console.error('⚠️ Client held for more than 30s!', client.lastQuery);
    client.release = originalRelease;
    client.release();
  }, 30000);

  client.release = (err) => {
    clearTimeout(timeout);
    client.query   = originalQuery;
    client.release = originalRelease;
    return originalRelease(err);
  };

  return client;
}

module.exports = { query, getClient, pool, testConnection };
