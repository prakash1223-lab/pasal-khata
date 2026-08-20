'use strict';

/**
 * Keep-alive pings for Render.com free tier.
 * Render free services sleep after 15 minutes of inactivity.
 * This pings /health every 10 minutes to prevent that.
 *
 * Only runs in production (started from server.js).
 */

const https = require('https');

const RENDER_URL = process.env.RENDER_EXTERNAL_URL;

function ping() {
  if (!RENDER_URL) return;

  const url = `${RENDER_URL}/health`;
  https.get(url, (res) => {
    console.log(`🏓 Keep-alive ping: ${res.statusCode} — ${new Date().toLocaleTimeString()}`);
  }).on('error', (err) => {
    console.warn('Keep-alive ping failed:', err.message);
  });
}

// Ping every 10 minutes
setInterval(ping, 10 * 60 * 1000);
console.log('🏓 Keep-alive started — pinging every 10 minutes');

module.exports = { ping };
