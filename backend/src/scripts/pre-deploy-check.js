'use strict';

/**
 * Pre-deploy checklist.
 * Run before pushing to GitHub: npm run pre-deploy
 */

require('dotenv').config();

const fs   = require('fs');
const path = require('path');

let passed = 0;
let failed = 0;

function check(name, condition, fix) {
  if (condition) {
    console.log(`✅ ${name}`);
    passed++;
  } else {
    console.log(`❌ ${name}`);
    console.log(`   Fix: ${fix}`);
    failed++;
  }
}

console.log('\n🔍 Pasal Khata Pre-Deploy Check\n');

// Environment
check('DATABASE_URL is set',
  !!process.env.DATABASE_URL,
  'Add DATABASE_URL to .env from Supabase dashboard');

check('JWT_SECRET is set',
  !!process.env.JWT_SECRET,
  'Run: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');

check('JWT_SECRET is long enough',
  (process.env.JWT_SECRET || '').length >= 32,
  'JWT_SECRET must be at least 32 characters long');

check('FRONTEND_URL is set',
  !!process.env.FRONTEND_URL,
  'Add your Vercel URL: FRONTEND_URL=https://your-app.vercel.app');

check('FRONTEND_URL uses https',
  process.env.FRONTEND_URL?.startsWith('https://'),
  'FRONTEND_URL must start with https://');

check('NODE_ENV is production',
  process.env.NODE_ENV === 'production',
  'Set NODE_ENV=production in Render environment variables');

// Files
check('server.js exists',
  fs.existsSync(path.join(__dirname, '../server.js')),
  'Make sure src/server.js exists');

check('app.js exists',
  fs.existsSync(path.join(__dirname, '../app.js')),
  'Make sure src/app.js exists');

check('render.yaml exists',
  fs.existsSync(path.join(__dirname, '../../render.yaml')),
  'Create render.yaml in backend/ folder');

check('migrations folder exists',
  fs.existsSync(path.join(__dirname, '../../migrations')),
  'Create migrations/ folder with SQL files');

// Dependencies
const pkg = require('../../package.json');
const requiredDeps = [
  'express', 'pg', 'jsonwebtoken', 'bcryptjs',
  'cors', 'helmet', 'compression', 'express-rate-limit',
];
requiredDeps.forEach(dep => {
  check(`${dep} in dependencies`,
    !!pkg.dependencies?.[dep],
    `Run: npm install ${dep}`);
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 All checks passed! Ready to deploy.\n');
} else {
  console.log(`⚠️  Fix ${failed} issue(s) before deploying.\n`);
  process.exit(1);
}
