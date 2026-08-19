'use strict';

const { Pool } = require('pg');
const { DATABASE_URL, NODE_ENV } = require('./env');

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

pool.on('connect', () => {
  // silent — too noisy to log every connection
});

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    return;
  }
  client.query('SELECT NOW()', (queryErr) => {
    release();
    if (queryErr) {
      console.error('❌ Database query error:', queryErr.message);
    } else {
      console.log('✅ Database connected');
    }
  });
});

/**
 * Run a parameterized query using the pool
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn('⚠️  Slow query detected:', { text: text.substring(0, 80), duration });
    }
    return res;
  } catch (err) {
    console.error('Database query error:', { text: text.substring(0, 80), err: err.message });
    throw err;
  }
}

/**
 * Get a client from the pool for transactions
 */
async function getClient() {
  const client = await pool.connect();
  const originalQuery   = client.query.bind(client);
  const originalRelease = client.release.bind(client);

  client.query = (...args) => {
    client.lastQuery = args;
    return originalQuery(...args);
  };

  const timeout = setTimeout(() => {
    console.error('⚠️  Client has been out for more than 30 seconds!', client.lastQuery);
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

module.exports = { query, getClient, pool };
