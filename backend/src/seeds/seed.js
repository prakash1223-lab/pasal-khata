'use strict';

/**
 * Seed script — populates the database with realistic Nepali demo data.
 * Usage: node src/seeds/seed.js
 *
 * SAFE: Will NOT delete existing data if the shop already has customers.
 * Only runs a full seed when the shop is empty (first-time setup).
 * To force a reseed, run: node src/seeds/seed.js --force
 */

require('dotenv').config();

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const FORCE = process.argv.includes('--force');

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomPast(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysAgo));
  return d.toISOString();
}

function addDays(isoDate, days) {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SHOP = {
  name: 'Ram Bhandar',
  address: 'Kirtipur-2, Kathmandu',
  phone: '9841234567',
};

const OWNER = {
  name: 'Ram Prasad Shrestha',
  email: 'ram@rambhandar.com',
  password: 'password123',
  role: 'owner',
};

const CUSTOMERS = [
  { name: 'Suresh Tamang',      phone: '9841111111', address: 'Baneshwor, Kathmandu' },
  { name: 'Radha Sharma',       phone: '9851222222', address: 'Koteshwor, Kathmandu' },
  { name: 'Manoj Karki',        phone: '9863333333', address: 'Lalitpur, Patan' },
  { name: 'Sita Thapa',         phone: '9876444444', address: 'Kirtipur, Kathmandu' },
  { name: 'Ram Bahadur Rai',    phone: '9812555555', address: 'Bhaktapur Taumadhi' },
];

const PRODUCTS = [
  { name: 'Musuri Dal',      category: 'Pulse',        price: 150, stockQuantity: 200, unit: 'kg',     costPrice: 130 },
  { name: 'Basmati Rice',    category: 'Grain',        price: 120, stockQuantity: 500, unit: 'kg',     costPrice: 100 },
  { name: 'Mustard Oil',     category: 'Oil',          price: 280, stockQuantity:  80, unit: 'ltr',    costPrice: 240 },
  { name: 'Milk Tea',        category: 'Beverage',     price:  35, stockQuantity: 150, unit: 'packet', costPrice:  25 },
  { name: 'Chini (Sugar)',   category: 'Sweetener',    price:  90, stockQuantity: 300, unit: 'kg',     costPrice:  75 },
  { name: 'Tata Salt',       category: 'Spice',        price:  25, stockQuantity: 200, unit: 'packet', costPrice:  18 },
  { name: 'Wai Wai Noodles', category: 'Instant Food', price:  30, stockQuantity: 400, unit: 'packet', costPrice:  22 },
  { name: 'Glucose Biscuit', category: 'Snack',        price:  45, stockQuantity: 250, unit: 'packet', costPrice:  32 },
];

// Sales definition: [customerIndex, [[productIndex, qty]], paidAmount, daysAgo]
const SALES_DEF = [
  [0, [[1, 10], [0, 5]],         1500, 14],  // Suresh — rice + dal, partial
  [1, [[2, 2], [4, 3]],           800, 12],  // Radha — oil + sugar, partial
  [2, [[1, 20], [3, 10]],        2750, 10],  // Manoj — rice + tea, partial
  [3, [[0, 8], [5, 5]],          1400, 10],  // Sita — dal + salt, paid
  [4, [[6, 20], [7, 15]],        1275, 9],   // Ram Bdr — noodles + biscuit, partial
  [0, [[2, 3], [4, 5]],          1290, 7],   // Suresh — oil + sugar, paid
  [1, [[1, 15], [0, 6]],         2700, 5],   // Radha — rice + dal, partial
  [2, [[6, 30], [7, 20]],         900, 4],   // Manoj — noodles + biscuit, partial
  [3, [[2, 1], [3, 5]],           455, 2],   // Sita — oil + tea, paid
  [4, [[1, 12], [4, 8]],         2160, 1],   // Ram Bdr — rice + sugar, partial
];

// Payments: [customerIndex, amount, daysAgo]
const PAYMENTS_DEF = [
  [0,  500, 13],
  [2, 1000, 9],
  [1,  800, 4],
  [3, 1400, 10],  // full payment for sale 4
  [4,  700, 0],
];

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  const client = await pool.connect();
  console.log('\n🌱 Starting seed...\n');

  try {
    await client.query('BEGIN');

    // 1. Create shop — find by owner email first, then by name
    console.log('📦 Creating shop...');

    // Check if owner already exists and get their shop
    const existingOwner = await client.query(
      `SELECT u.shop_id FROM users u WHERE u.email = $1 LIMIT 1`,
      [OWNER.email]
    );

    let shop;
    if (existingOwner.rowCount > 0) {
      const existing = await client.query(
        `SELECT * FROM shops WHERE id = $1 LIMIT 1`,
        [existingOwner.rows[0].shop_id]
      );
      shop = existing.rows[0];
      console.log(`   ℹ️  Owner already exists → using shop: ${shop.name} (${shop.id})`);
    } else {
      const shopRes = await client.query(
        `INSERT INTO shops (name, address, phone) VALUES ($1, $2, $3) RETURNING *`,
        [SHOP.name, SHOP.address, SHOP.phone]
      );
      shop = shopRes.rows[0];
      console.log(`   ✅ Shop created: ${shop.name} (${shop.id})`);
    }

    const shopId = shop.id;

    // ── Guard: skip wipe unless --force flag is passed ─────────────────────
    const existingCustomers = await client.query(
      `SELECT COUNT(*) FROM customers WHERE shop_id = $1`, [shopId]
    );
    const customerCount = parseInt(existingCustomers.rows[0].count, 10);

    if (customerCount > 0 && !FORCE) {
      console.log(`\n⚠️  This shop already has ${customerCount} customer(s). Seed will NOT run.`);
      console.log('   This protects any real data you have added.');
      console.log('\n   To clear demo data first, run:  npm run cleanup');
      console.log('   Then re-seed with:               npm run seed\n');
      await client.query('ROLLBACK');
      return;
    }

    // 2. Clean existing seeded data for this shop (only runs with --force)
    if (FORCE) {
      console.log('\n🧹 --force flag detected. Cleaning existing data...');
    } else {
      console.log('\n🧹 First-time setup. Cleaning any partial data...');
    }
    await client.query(`DELETE FROM supplier_payments WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM purchase_items WHERE purchase_id IN (SELECT id FROM purchases WHERE shop_id = $1)`, [shopId]);
    await client.query(`DELETE FROM purchases  WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM suppliers  WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM payments   WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM sale_items WHERE sale_id IN (SELECT id FROM sales WHERE shop_id = $1)`, [shopId]);
    await client.query(`DELETE FROM sales      WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM products   WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM customers  WHERE shop_id = $1`, [shopId]);
    await client.query(`DELETE FROM users      WHERE shop_id = $1`, [shopId]);
    console.log('   ✅ Cleaned');

    // 3. Create owner user
    console.log('\n👤 Creating owner user...');
    const passwordHash = await bcrypt.hash(OWNER.password, 12);
    const userRes = await client.query(
      `INSERT INTO users (shop_id, name, email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (email) DO UPDATE SET shop_id=$1, name=$2, phone=$4, password_hash=$5
       RETURNING *`,
      [shopId, OWNER.name, OWNER.email, SHOP.phone, passwordHash, OWNER.role]
    );
    const owner = userRes.rows[0];
    console.log(`   ✅ Owner: ${owner.name} (${owner.email})`);

    // 4. Create customers
    console.log('\n👥 Creating customers...');
    const customerIds = [];
    for (const c of CUSTOMERS) {
      const res = await client.query(
        `INSERT INTO customers (shop_id, name, phone, address)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [shopId, c.name, c.phone, c.address]
      );
      customerIds.push(res.rows[0].id);
      console.log(`   ✅ ${res.rows[0].name}`);
    }

    // 5. Create products
    console.log('\n📦 Creating products...');
    const productIds = [];
    for (const p of PRODUCTS) {
      const res = await client.query(
        `INSERT INTO products (shop_id, name, category, price, stock_quantity, unit, cost_price)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [shopId, p.name, p.category, p.price, p.stockQuantity, p.unit, p.costPrice]
      );
      productIds.push(res.rows[0]);
      console.log(`   ✅ ${res.rows[0].name} — sell ₨${p.price}, cost ₨${p.costPrice}/${p.unit}`);
    }

    // 6. Create sales
    console.log('\n🛒 Creating sales...');
    for (const [custIdx, itemsDef, paidAmount, daysAgo] of SALES_DEF) {
      const customerId = customerIds[custIdx];
      const saleDate = randomPast(daysAgo + 1);

      // Compute total
      let totalAmount = 0;
      const resolvedItems = itemsDef.map(([prodIdx, qty]) => {
        const prod = productIds[prodIdx];
        const lineTotal = parseFloat((qty * prod.price).toFixed(2));
        totalAmount += lineTotal;
        return { prod, qty, lineTotal };
      });
      totalAmount = parseFloat(totalAmount.toFixed(2));

      const paid = Math.min(paidAmount, totalAmount);
      const baki = parseFloat((totalAmount - paid).toFixed(2));
      const status = paid >= totalAmount ? 'paid' : paid === 0 ? 'unpaid' : 'partial';

      // Insert sale
      const saleRes = await client.query(
        `INSERT INTO sales (shop_id, customer_id, created_by, total_amount, paid_amount, baki_amount, payment_status, sale_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [shopId, customerId, owner.id, totalAmount, paid, baki, status, saleDate]
      );
      const sale = saleRes.rows[0];

      // Insert sale items + deduct stock
      for (const { prod, qty, lineTotal } of resolvedItems) {
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [sale.id, prod.id, prod.name, qty, prod.price, lineTotal]
        );
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2`,
          [qty, prod.id]
        );
      }

      // Update customer balances
      await client.query(
        `UPDATE customers
           SET total_purchased = total_purchased + $1,
               total_paid      = total_paid + $2,
               baki            = GREATEST(0, baki + $3),
               updated_at      = NOW()
         WHERE id = $4`,
        [totalAmount, paid, baki, customerId]
      );

      const itemNames = resolvedItems.map(i => `${i.prod.name} ×${i.qty}`).join(', ');
      console.log(`   ✅ Sale [${CUSTOMERS[custIdx].name}] — ₨${totalAmount} | paid ₨${paid} | baki ₨${baki} | ${itemNames}`);
    }

    // 7. Create payments
    console.log('\n💵 Creating payments...');
    for (const [custIdx, amount, daysAgo] of PAYMENTS_DEF) {
      const customerId = customerIds[custIdx];
      const paymentDate = randomPast(daysAgo + 1);

      await client.query(
        `INSERT INTO payments (shop_id, customer_id, received_by, amount, payment_method, payment_date)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [shopId, customerId, owner.id, amount, 'cash', paymentDate]
      );

      // Update customer
      await client.query(
        `UPDATE customers
           SET total_paid = total_paid + $1,
               baki       = GREATEST(0, baki - $1),
               updated_at = NOW()
         WHERE id = $2`,
        [amount, customerId]
      );

      console.log(`   ✅ Payment [${CUSTOMERS[custIdx].name}] — ₨${amount}`);
    }

    // 8. Create suppliers
    console.log('\n🏭 Creating suppliers...');
    const SUPPLIERS = [
      { name: 'Hari Krishna Shrestha', company: 'Shrestha Traders',       phone: '9801234567', address: 'Asan, Kathmandu' },
      { name: 'Bikash Maharjan',        company: 'Maharjan Distributors',  phone: '9812345678', address: 'Lalitpur' },
      { name: 'Sunita Thapa',           company: 'Thapa General Store',    phone: '9823456789', address: 'Bhaktapur' },
    ];
    const supplierIds = [];
    for (const s of SUPPLIERS) {
      const res = await client.query(
        `INSERT INTO suppliers (shop_id, name, company_name, phone, address)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [shopId, s.name, s.company, s.phone, s.address]
      );
      supplierIds.push(res.rows[0].id);
      console.log(`   ✅ ${s.name} (${s.company})`);
    }

    // 9. Create purchases
    // [supplierIdx, [[productIdx, qty, costPrice]], paidAmount, daysAgo]
    console.log('\n🛒 Creating purchases...');
    const PURCHASES_DEF = [
      [0, [[1, 100, 100], [0, 50, 130]],  8000, 20],
      [0, [[2, 30,  240]],                4000, 15],
      [1, [[6, 200, 22],  [7, 100, 32]], 7600,  12],
      [2, [[3, 100, 25],  [5, 100, 18]], 3000,   8],
      [1, [[4, 50,  75]],               2500,    5],
    ];
    for (const [supIdx, itemsDef, paidAmount, daysAgo] of PURCHASES_DEF) {
      const supplierId  = supplierIds[supIdx];
      const purchDate   = randomPast(daysAgo + 1);
      let totalAmount   = 0;
      const resolvedItems = itemsDef.map(([prodIdx, qty, costPrice]) => {
        const prod = productIds[prodIdx];
        const lineTotal = parseFloat((qty * costPrice).toFixed(2));
        totalAmount += lineTotal;
        return { prod, qty, costPrice, lineTotal };
      });
      totalAmount = parseFloat(totalAmount.toFixed(2));
      const paid    = Math.min(paidAmount, totalAmount);
      const udharo  = parseFloat((totalAmount - paid).toFixed(2));
      const status  = paid >= totalAmount ? 'paid' : paid === 0 ? 'unpaid' : 'partial';

      const purRes = await client.query(
        `INSERT INTO purchases
           (shop_id, supplier_id, created_by, total_amount, paid_amount, udharo_amount, payment_status, purchase_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [shopId, supplierId, owner.id, totalAmount, paid, udharo, status, purchDate]
      );
      const purchase = purRes.rows[0];

      for (const { prod, qty, costPrice, lineTotal } of resolvedItems) {
        await client.query(
          `INSERT INTO purchase_items
             (purchase_id, product_id, product_name, quantity, unit, cost_price, total_price)
           VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [purchase.id, prod.id, prod.name, qty, prod.unit, costPrice, lineTotal]
        );
        await client.query(
          `UPDATE products SET stock_quantity = stock_quantity + $1, cost_price = $2 WHERE id = $3`,
          [qty, costPrice, prod.id]
        );
      }

      await client.query(
        `UPDATE suppliers SET total_purchased=$1, total_paid=$2, udharo=GREATEST(0,udharo+$3)
         WHERE id=$4`,
        [totalAmount, paid, udharo, supplierId]
      );

      if (paid > 0) {
        await client.query(
          `INSERT INTO supplier_payments (shop_id, supplier_id, purchase_id, paid_by, amount, payment_method, payment_date)
           VALUES ($1,$2,$3,$4,$5,'cash',$6)`,
          [shopId, supplierId, purchase.id, owner.id, paid, purchDate]
        );
      }

      const supplierName = SUPPLIERS[supIdx].name;
      const itemNames = resolvedItems.map(i => `${i.prod.name} ×${i.qty}`).join(', ');
      console.log(`   ✅ Purchase [${supplierName}] — ₨${totalAmount} | paid ₨${paid} | उधारो ₨${udharo} | ${itemNames}`);
    }

    await client.query('COMMIT');

    // Print summary
    const summary = await client.query(
      `SELECT name, phone, baki, total_purchased, total_paid
       FROM customers WHERE shop_id = $1 ORDER BY name`,
      [shopId]
    );

    console.log('\n📊 Customer balances after seed:');
    console.log('─'.repeat(60));
    for (const c of summary.rows) {
      const baki = parseFloat(c.baki);
      const flag = baki > 0 ? '🔴' : '✅';
      console.log(`  ${flag} ${c.name.padEnd(22)} baki: ₨${String(baki).padStart(8)} | bought: ₨${c.total_purchased} | paid: ₨${c.total_paid}`);
    }
    console.log('─'.repeat(60));

    console.log('\n🎉 Seed complete!\n');
    console.log('   Login credentials:');
    console.log(`   Owner  → email: ${OWNER.email} | password: ${OWNER.password}`);
    console.log(`   Customer login → phone: ${CUSTOMERS[0].phone} | shopId: ${shopId}`);
    console.log(`   Shop ID: ${shopId}`);
    console.log('');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\n❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
