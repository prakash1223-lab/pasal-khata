'use strict';

const ExcelJS = require('exceljs');
const db      = require('../config/db');
const { createBackup, getLastBackupInfo } = require('../scripts/backup');
const { successResponse, errorResponse }  = require('../utils/responseHelper');

// ── GET /api/export/all ────────────────────────────────────────────────────────
async function exportAll(req, res) {
  try {
    const shopId = req.user.shopId;
    const tables = [
      'shops', 'users', 'customers', 'products', 'suppliers',
      'sales', 'sale_items', 'payments', 'purchases', 'purchase_items', 'supplier_payments',
    ];

    const data = { version: '1.0', createdAt: new Date().toISOString(), tables: {} };
    for (const table of tables) {
      try {
        // Only export records belonging to this shop where possible
        const hasSopId = !['sale_items', 'purchase_items'].includes(table);
        const res2 = hasSopId
          ? await db.query(`SELECT * FROM ${table} WHERE shop_id = $1`, [shopId])
          : await db.query(`SELECT * FROM ${table}`);
        data.tables[table] = res2.rows;
      } catch {
        data.tables[table] = [];
      }
    }

    const filename = `pasal-khata-backup-${new Date().toISOString().split('T')[0]}.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('exportAll error:', err);
    return errorResponse(res, 'Export failed', 500);
  }
}

// ── GET /api/export/customers ─────────────────────────────────────────────────
async function exportCustomers(req, res) {
  try {
    const shopId = req.user.shopId;
    const result = await db.query(
      'SELECT name, phone, address, baki, total_purchased, total_paid, created_at FROM customers WHERE shop_id=$1 ORDER BY name',
      [shopId]
    );

    const header = 'Name,Phone,Address,Baki,Total Bought,Total Paid,Member Since\n';
    const rows   = result.rows.map(r =>
      [r.name, r.phone, `"${r.address || ''}"`, r.baki, r.total_purchased, r.total_paid,
       new Date(r.created_at).toLocaleDateString()].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="customers-${Date.now()}.csv"`);
    res.send(header + rows);
  } catch (err) {
    return errorResponse(res, 'Export failed', 500);
  }
}

// ── GET /api/export/sales ─────────────────────────────────────────────────────
async function exportSales(req, res) {
  try {
    const shopId = req.user.shopId;
    const result = await db.query(
      `SELECT s.id, c.name AS customer_name, s.total_amount, s.paid_amount, s.baki_amount,
              s.payment_status, s.sale_date
       FROM sales s LEFT JOIN customers c ON c.id = s.customer_id
       WHERE s.shop_id=$1 ORDER BY s.sale_date DESC`,
      [shopId]
    );

    const header = 'Customer,Total,Paid,Baki,Status,Date\n';
    const rows   = result.rows.map(r =>
      [`"${r.customer_name || ''}"`, r.total_amount, r.paid_amount, r.baki_amount,
       r.payment_status, new Date(r.sale_date).toLocaleDateString()].join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="sales-${Date.now()}.csv"`);
    res.send(header + rows);
  } catch (err) {
    return errorResponse(res, 'Export failed', 500);
  }
}

// ── GET /api/export/excel ──────────────────────────────────────────────────────
async function exportExcel(req, res) {
  try {
    const shopId   = req.user.shopId;
    const workbook = new ExcelJS.Workbook();
    workbook.creator   = 'Pasal Khata';
    workbook.created   = new Date();
    workbook.title     = 'Pasal Khata Export';

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1d4ed8' } },
    };

    function applyHeader(sheet) {
      const row = sheet.getRow(1);
      row.eachCell(cell => Object.assign(cell, headerStyle));
      row.commit();
    }

    // Sheet 1: Customers
    const cs = workbook.addWorksheet('Customers');
    cs.columns = [
      { header: 'Name',         key: 'name',             width: 25 },
      { header: 'Phone',        key: 'phone',            width: 15 },
      { header: 'Address',      key: 'address',          width: 30 },
      { header: 'Total Bought', key: 'total_purchased',  width: 15 },
      { header: 'Total Paid',   key: 'total_paid',       width: 15 },
      { header: 'Baki',         key: 'baki',             width: 15 },
      { header: 'Member Since', key: 'created_at',       width: 20 },
    ];
    const customers = await db.query(
      'SELECT name,phone,address,total_purchased,total_paid,baki,created_at FROM customers WHERE shop_id=$1 ORDER BY name',
      [shopId]
    );
    cs.addRows(customers.rows);
    applyHeader(cs);

    // Sheet 2: Sales
    const ss = workbook.addWorksheet('Sales');
    ss.columns = [
      { header: 'Customer',    key: 'customer_name',   width: 25 },
      { header: 'Total',       key: 'total_amount',    width: 15 },
      { header: 'Paid',        key: 'paid_amount',     width: 15 },
      { header: 'Baki',        key: 'baki_amount',     width: 15 },
      { header: 'Status',      key: 'payment_status',  width: 12 },
      { header: 'Date',        key: 'sale_date',       width: 20 },
    ];
    const sales = await db.query(
      `SELECT c.name AS customer_name, s.total_amount, s.paid_amount, s.baki_amount,
              s.payment_status, s.sale_date
       FROM sales s LEFT JOIN customers c ON c.id=s.customer_id
       WHERE s.shop_id=$1 ORDER BY s.sale_date DESC`,
      [shopId]
    );
    ss.addRows(sales.rows);
    applyHeader(ss);

    // Sheet 3: Payments
    const ps = workbook.addWorksheet('Payments');
    ps.columns = [
      { header: 'Customer',      key: 'customer_name',   width: 25 },
      { header: 'Amount',        key: 'amount',          width: 15 },
      { header: 'Method',        key: 'payment_method',  width: 15 },
      { header: 'Note',          key: 'note',            width: 30 },
      { header: 'Date',          key: 'payment_date',    width: 20 },
    ];
    const payments = await db.query(
      `SELECT c.name AS customer_name, p.amount, p.payment_method, p.note, p.payment_date
       FROM payments p LEFT JOIN customers c ON c.id=p.customer_id
       WHERE p.shop_id=$1 ORDER BY p.payment_date DESC`,
      [shopId]
    );
    ps.addRows(payments.rows);
    applyHeader(ps);

    // Sheet 4: Products
    const prs = workbook.addWorksheet('Products');
    prs.columns = [
      { header: 'Name',          key: 'name',            width: 25 },
      { header: 'Category',      key: 'category',        width: 15 },
      { header: 'Sell Price',    key: 'price',           width: 15 },
      { header: 'Cost Price',    key: 'cost_price',      width: 15 },
      { header: 'Stock',         key: 'stock_quantity',  width: 12 },
      { header: 'Unit',          key: 'unit',            width: 10 },
      { header: 'Status',        key: 'stock_status',    width: 14 },
    ];
    const products = await db.query(
      'SELECT name,category,price,cost_price,stock_quantity,unit FROM products WHERE shop_id=$1 ORDER BY name',
      [shopId]
    );
    prs.addRows(products.rows.map(p => ({
      ...p,
      stock_status: p.stock_quantity <= 0 ? 'Out of Stock'
        : p.stock_quantity <= 10 ? 'Low Stock' : 'In Stock',
    })));
    applyHeader(prs);

    // Sheet 5: Suppliers
    const sups = workbook.addWorksheet('Suppliers');
    sups.columns = [
      { header: 'Name',           key: 'name',            width: 25 },
      { header: 'Company',        key: 'company_name',    width: 25 },
      { header: 'Phone',          key: 'phone',           width: 15 },
      { header: 'Total Purchased',key: 'total_purchased', width: 18 },
      { header: 'Total Paid',     key: 'total_paid',      width: 15 },
      { header: 'Udharo',         key: 'udharo',          width: 15 },
    ];
    const suppliers = await db.query(
      'SELECT name,company_name,phone,total_purchased,total_paid,udharo FROM suppliers WHERE shop_id=$1 ORDER BY name',
      [shopId]
    );
    sups.addRows(suppliers.rows);
    applyHeader(sups);

    const filename = `pasal-khata-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('exportExcel error:', err);
    return errorResponse(res, 'Excel export failed', 500);
  }
}

// ── GET /api/export/backup-status ─────────────────────────────────────────────
async function backupStatus(req, res) {
  try {
    const info = getLastBackupInfo();
    return successResponse(res, info);
  } catch (err) {
    return errorResponse(res, 'Could not get backup status', 500);
  }
}

// ── POST /api/export/backup ────────────────────────────────────────────────────
async function triggerBackup(req, res) {
  try {
    const file = await createBackup();
    const info = getLastBackupInfo();
    return successResponse(res, { message: 'Backup created', ...info });
  } catch (err) {
    console.error('triggerBackup error:', err);
    return errorResponse(res, 'Backup failed', 500);
  }
}

module.exports = { exportAll, exportCustomers, exportSales, exportExcel, backupStatus, triggerBackup };
