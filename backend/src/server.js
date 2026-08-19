'use strict';

const app      = require('./app');
const { PORT } = require('./config/env');
const { pool } = require('./config/db');

async function start() {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully');
  } catch (err) {
    console.error('❌ Cannot connect to database:', err.message);
    process.exit(1);
  }

  // Start automatic backup scheduler (daily at midnight Nepal time)
  require('./scripts/scheduler');

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('╔═══════════════════════════════════════╗');
    console.log('║        PASAL KHATA SERVER             ║');
    console.log('║        पसल खाता                        ║');
    console.log('╠═══════════════════════════════════════╣');
    console.log(`║  Status:  Running                     ║`);
    console.log(`║  Port:    ${PORT}                        ║`);
    console.log(`║  Env:     ${(process.env.NODE_ENV || 'development').padEnd(12)}           ║`);
    console.log('╚═══════════════════════════════════════╝');
    console.log('');
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await pool.end();
      console.log('Database pool closed. Bye! 🙏');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    if (process.env.NODE_ENV === 'production') process.exit(1);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
  });
}

start();
