'use strict';

const cron = require('node-cron');
const { createBackup } = require('./backup');

async function runBackup() {
  console.log('\n⏰ Scheduled backup starting...');
  try {
    await createBackup();
    console.log('✅ Scheduled backup completed\n');
  } catch (err) {
    console.error('❌ Scheduled backup failed:', err.message);
  }
}

// Every day at midnight Nepal time
cron.schedule('0 0 * * *', runBackup, { timezone: 'Asia/Kathmandu' });

console.log('⏰ Backup scheduler started — daily backup at 12:00 AM Nepal time');

module.exports = { runBackup };
