'use strict';

const { query } = require('../config/db');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// GET /api/dashboard
async function getDashboard(req, res) {
  try {
    const { shopId } = req.user;

    // Run all queries in parallel for speed
    const [
      todaySalesRes,
      totalBakiRes,
      topBakiRes,
      recentSalesRes,
      recentPaymentsRes,
      thisMonthRes,
      totalCustomersRes,
      totalProductsRes,
      totalUdharoRes,
      topUdharoSuppliersRes,
      thisMonthPurchasesRes,
      todayPurchasesRes,
      todayPaymentsRes,
    ] = await Promise.all([
      // Today's sales summary
      query(
        `SELECT
           COUNT(*)::int                                          AS count,
           COALESCE(SUM(total_amount), 0)                        AS total,
           COALESCE(SUM(paid_amount), 0)                         AS cash_amount,
           COALESCE(SUM(baki_amount), 0)                         AS credit_amount
         FROM sales
         WHERE shop_id = $1
           AND DATE(sale_date AT TIME ZONE 'Asia/Kathmandu') = CURRENT_DATE`,
        [shopId]
      ),

      // Total outstanding baki
      query(
        `SELECT
           COALESCE(SUM(baki), 0)   AS amount,
           COUNT(*)::int            AS customer_count
         FROM customers
         WHERE shop_id = $1 AND baki > 0`,
        [shopId]
      ),

      // Top 5 baki customers
      query(
        `SELECT
           c.id, c.name, c.phone, c.baki,
           (SELECT MAX(s.sale_date)
            FROM sales s
            WHERE s.customer_id = c.id) AS last_purchase_date
         FROM customers c
         WHERE c.shop_id = $1 AND c.baki > 0
         ORDER BY c.baki DESC
         LIMIT 5`,
        [shopId]
      ),

      // Recent 10 sales
      query(
        `SELECT
           s.id, s.total_amount, s.paid_amount, s.baki_amount,
           s.payment_status, s.sale_date,
           c.name AS customer_name,
           (SELECT json_agg(json_build_object('name', si.product_name, 'qty', si.quantity))
            FROM sale_items si WHERE si.sale_id = s.id) AS items
         FROM sales s
         LEFT JOIN customers c ON c.id = s.customer_id
         WHERE s.shop_id = $1
         ORDER BY s.sale_date DESC
         LIMIT 10`,
        [shopId]
      ),

      // Recent 5 payments
      query(
        `SELECT
           p.id, p.amount, p.payment_method, p.payment_date,
           c.name AS customer_name
         FROM payments p
         LEFT JOIN customers c ON c.id = p.customer_id
         WHERE p.shop_id = $1
         ORDER BY p.payment_date DESC
         LIMIT 5`,
        [shopId]
      ),

      // This month's sales
      query(
        `SELECT
           COUNT(*)::int               AS count,
           COALESCE(SUM(total_amount), 0) AS total
         FROM sales
         WHERE shop_id = $1
           AND DATE_TRUNC('month', sale_date) = DATE_TRUNC('month', CURRENT_DATE)`,
        [shopId]
      ),

      // Total customers
      query(
        `SELECT COUNT(*)::int AS count FROM customers WHERE shop_id = $1`,
        [shopId]
      ),

      // Total active products
      query(
        `SELECT COUNT(*)::int AS count FROM products WHERE shop_id = $1 AND is_active = true`,
        [shopId]
      ),

      // Total udharo to suppliers
      query(
        `SELECT COALESCE(SUM(udharo),0) AS amount, COUNT(*)::int AS supplier_count
         FROM suppliers WHERE shop_id=$1 AND udharo > 0 AND is_active=true`,
        [shopId]
      ),

      // Top udharo suppliers
      query(
        `SELECT id, name, company_name, phone, udharo,
                (SELECT MAX(purchase_date) FROM purchases p WHERE p.supplier_id = suppliers.id) AS last_purchase_date
         FROM suppliers WHERE shop_id=$1 AND udharo > 0 AND is_active=true
         ORDER BY udharo DESC LIMIT 5`,
        [shopId]
      ),

      // This month purchases total cost
      query(
        `SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*)::int AS count
         FROM purchases WHERE shop_id=$1
           AND DATE_TRUNC('month', purchase_date) = DATE_TRUNC('month', CURRENT_DATE)`,
        [shopId]
      ),

      // Today purchases
      query(
        `SELECT COALESCE(SUM(total_amount),0) AS total, COUNT(*)::int AS count
         FROM purchases WHERE shop_id=$1
           AND purchase_date::date = CURRENT_DATE`,
        [shopId]
      ),

      // Today's payments received (baki repayments)
      query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM payments
         WHERE shop_id = $1
           AND DATE(payment_date AT TIME ZONE 'Asia/Kathmandu') = CURRENT_DATE`,
        [shopId]
      ),
    ]);    // Build recent transactions list (sales + payments merged, sorted by date)
    const recentSales = recentSalesRes.rows.map(s => ({
      type: 'sale',
      id: s.id,
      customerName: s.customer_name,
      description: Array.isArray(s.items)
        ? s.items.map(i => `${i.name} ×${i.qty}`).join(', ')
        : '',
      amount:      s.total_amount,
      baki_amount: s.baki_amount,
      date:        s.sale_date,
      status:      s.payment_status,
    }));

    const recentPayments = recentPaymentsRes.rows.map(p => ({
      type: 'payment',
      id: p.id,
      customerName: p.customer_name,
      description: `Payment via ${p.payment_method}`,
      amount: p.amount,
      date: p.payment_date,
      status: 'received',
    }));

    const recentTransactions = [...recentSales, ...recentPayments]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    const today = todaySalesRes.rows[0];
    const baki = totalBakiRes.rows[0];
    const month = thisMonthRes.rows[0];
    const udharoRow = totalUdharoRes.rows[0];
    const monthPurchase = thisMonthPurchasesRes.rows[0];
    const todayPurchase = todayPurchasesRes.rows[0];

    // Cash received today = amount paid at point of sale + baki payments received today
    const todayPaymentsTotal = parseFloat(todayPaymentsRes.rows[0].total ?? 0);
    const todayCashReceived  = parseFloat(today.cash_amount) + todayPaymentsTotal;

    const totalRevenue = parseFloat(month.total);
    const totalCost    = parseFloat(monthPurchase.total);
    const grossProfit  = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;

    return successResponse(res, {
      todaySales: {
        total: parseFloat(today.total),
        count: today.count,
        cashAmount: todayCashReceived,
        creditAmount: parseFloat(today.credit_amount),
      },
      totalBaki: {
        amount: parseFloat(baki.amount),
        customerCount: baki.customer_count,
      },
      topBakiCustomers: topBakiRes.rows.map(c => ({
        id: c.id, name: c.name, phone: c.phone,
        baki: parseFloat(c.baki), lastPurchaseDate: c.last_purchase_date,
      })),
      recentTransactions,
      thisMonthSales: {
        total: parseFloat(month.total),
        count: month.count,
      },
      totalCustomers: totalCustomersRes.rows[0].count,
      totalProducts:  totalProductsRes.rows[0].count,
      purchaseSummary: {
        todayPurchases: {
          total: parseFloat(todayPurchase.total),
          count: todayPurchase.count,
        },
        thisMonthPurchases: {
          total: parseFloat(monthPurchase.total),
          count: monthPurchase.count,
        },
        totalUdharo: {
          amount: parseFloat(udharoRow.amount),
          supplierCount: udharoRow.supplier_count,
        },
      },
      topUdharoSuppliers: topUdharoSuppliersRes.rows.map(s => ({
        id: s.id, name: s.name, companyName: s.company_name,
        phone: s.phone, udharo: parseFloat(s.udharo),
        lastPurchaseDate: s.last_purchase_date,
      })),
      profitSummary: {
        thisMonth: {
          totalRevenue,
          totalCost,
          grossProfit,
          profitMarginPercent: profitMargin,
        },
      },
    });
  } catch (err) {
    console.error('getDashboard error:', err);
    return errorResponse(res, 'Failed to load dashboard', 500);
  }
}

module.exports = { getDashboard };
