'use strict';

const app                    = require('./app');
const { pool, testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    console.log('\n🚀 Starting Pasal Khata Server...');
    console.log('Environment:', process.env.NODE_ENV || 'development');

    await testConnection();

    // Start backup scheduler (daily at midnight Nepal time)
    require('./scripts/scheduler');

    // Keep-alive pings for Render free tier
    if (process.env.NODE_ENV === 'production') {
      require('./scripts/keep-alive');
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('╔══════════════════════════════════════╗');
      console.log('║      PASAL KHATA — पसल खाता          ║');
      console.log('╠══════════════════════════════════════╣');
      console.log('║  Status:   Running ✅                ║');
      console.log(`║  Port:     ${PORT}                      ║`);
      console.log(`║  Env:      ${(process.env.NODE_ENV || 'development').padEnd(11)}            ║`);
      console.log('╚══════════════════════════════════════╝');
      console.log('');
    });

    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        try {
          await pool.end();
          console.log('✅ Database pool closed');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err.message);
          process.exit(1);
        }
      });
      // Force shutdown after 30s
      setTimeout(() => {
        console.error('Forced shutdown after 30s timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err.message);
      gracefulShutdown('uncaughtException');
    });

  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('Check your DATABASE_URL and database connection');
    process.exit(1);
  }
}

startServer();
