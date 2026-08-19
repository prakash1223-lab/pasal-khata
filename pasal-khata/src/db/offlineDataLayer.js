/**
 * Offline-First Data Layer
 * All reads and writes go through here — works online or offline.
 * Writes immediately update IndexedDB and queue a sync task.
 */
import { getDB }                           from './localDB';
import { addToSyncQueue, SYNC_ACTIONS }    from './syncQueue';
import { generateUUID }                    from '../utils/offlineId';

// ─────────────────────────────────────────────────────────────────────────────

export const offlineDB = {

  // ── CUSTOMERS ───────────────────────────────────────────────────────────────
  customers: {
    async getAll(shopId, filters = {}) {
      const db = await getDB();
      let customers = await db.getAllFromIndex('customers', 'shop_id', shopId);

      if (filters.search) {
        const s = filters.search.toLowerCase();
        customers = customers.filter(c =>
          c.name?.toLowerCase().includes(s) ||
          c.phone?.includes(s)
        );
      }

      customers.sort((a, b) => parseFloat(b.baki || 0) - parseFloat(a.baki || 0));
      return customers;
    },

    async getById(id) {
      const db = await getDB();
      return db.get('customers', id);
    },

    async create(customerData, shopId) {
      const db = await getDB();
      const id = generateUUID();
      const customer = {
        ...customerData,
        id,
        shop_id:         shopId,
        total_purchased: 0,
        total_paid:      0,
        baki:            0,
        created_at:      new Date().toISOString(),
        updated_at:      new Date().toISOString(),
        _isOffline:      true,
      };
      await db.add('customers', customer);
      await addToSyncQueue(SYNC_ACTIONS.CREATE_CUSTOMER, customer, id);
      return customer;
    },

    async update(id, updateData) {
      const db       = await getDB();
      const existing = await db.get('customers', id);
      if (!existing) throw new Error('Customer not found');
      const updated = {
        ...existing,
        ...updateData,
        updated_at: new Date().toISOString(),
        _isOffline: true,
      };
      await db.put('customers', updated);
      await addToSyncQueue(SYNC_ACTIONS.UPDATE_CUSTOMER, { id, ...updateData }, id);
      return updated;
    },

    async updateBalance(id, totalPurchasedDelta, totalPaidDelta) {
      const db       = await getDB();
      const customer = await db.get('customers', id);
      if (!customer) return;
      customer.total_purchased = parseFloat(customer.total_purchased || 0) + totalPurchasedDelta;
      customer.total_paid      = parseFloat(customer.total_paid      || 0) + totalPaidDelta;
      customer.baki            = Math.max(0, customer.total_purchased - customer.total_paid);
      customer.updated_at      = new Date().toISOString();
      await db.put('customers', customer);
      return customer;
    },

    async saveFromServer(customers) {
      const db = await getDB();
      console.log(`💾 saveFromServer: saving ${customers.length} customers to IndexedDB`);
      if (customers.length === 0) return;
      const tx = db.transaction('customers', 'readwrite');
      for (const c of customers) {
        await tx.store.put({ ...c, _isOffline: false });
      }
      await tx.done;
      console.log(`💾 saveFromServer: done saving customers`);
    },
  },

  // ── PRODUCTS ────────────────────────────────────────────────────────────────
  products: {
    async getAll(shopId, filters = {}) {
      const db = await getDB();
      let products = await db.getAllFromIndex('products', 'shop_id', shopId);

      if (filters.search) {
        const s = filters.search.toLowerCase();
        products = products.filter(p => p.name?.toLowerCase().includes(s));
      }

      return products
        .filter(p => p.is_active !== false)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => ({
          ...p,
          stock_status:
            p.stock_quantity <= 0  ? 'out_of_stock' :
            p.stock_quantity <= 10 ? 'low_stock'    : 'in_stock',
        }));
    },

    async getById(id) {
      const db = await getDB();
      return db.get('products', id);
    },

    async create(productData, shopId) {
      const db = await getDB();
      const id = generateUUID();
      const product = {
        ...productData,
        id,
        shop_id:        shopId,
        stock_quantity: parseInt(productData.stockQuantity || productData.stock_quantity || 0),
        price:          parseFloat(productData.price),
        cost_price:     parseFloat(productData.costPrice || productData.cost_price || 0),
        is_active:      true,
        created_at:     new Date().toISOString(),
        updated_at:     new Date().toISOString(),
        _isOffline:     true,
      };
      await db.add('products', product);
      await addToSyncQueue(SYNC_ACTIONS.CREATE_PRODUCT, product, id);
      return product;
    },

    async update(id, updateData) {
      const db       = await getDB();
      const existing = await db.get('products', id);
      if (!existing) throw new Error('Product not found');
      const updated = {
        ...existing,
        ...updateData,
        updated_at: new Date().toISOString(),
        _isOffline: true,
      };
      await db.put('products', updated);
      await addToSyncQueue(SYNC_ACTIONS.UPDATE_PRODUCT, { id, ...updateData }, id);
      return updated;
    },

    async delete(id) {
      const db = await getDB();
      const existing = await db.get('products', id);
      if (!existing) return;
      await db.put('products', { ...existing, is_active: false, _isOffline: true });
    },

    async adjustStock(id, delta) {
      const db      = await getDB();
      const product = await db.get('products', id);
      if (!product) return;
      product.stock_quantity = Math.max(0, (product.stock_quantity || 0) + delta);
      product.updated_at     = new Date().toISOString();
      await db.put('products', product);
    },

    async saveFromServer(products) {
      const db = await getDB();
      const tx = db.transaction('products', 'readwrite');
      for (const p of products) await tx.store.put({ ...p, _isOffline: false });
      await tx.done;
    },
  },

  // ── SALES ───────────────────────────────────────────────────────────────────
  sales: {
    async getAll(shopId, filters = {}) {
      const db = await getDB();
      let sales = await db.getAllFromIndex('sales', 'shop_id', shopId);

      if (filters.customerId) {
        sales = sales.filter(s => s.customer_id === filters.customerId);
      }
      if (filters.startDate) {
        sales = sales.filter(s => new Date(s.sale_date) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        sales = sales.filter(s => new Date(s.sale_date) <= new Date(filters.endDate + 'T23:59:59'));
      }

      const customers   = await db.getAllFromIndex('customers', 'shop_id', shopId);
      const customerMap = {};
      customers.forEach(c => { customerMap[c.id] = c.name; });

      return sales
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
        .map(s => ({ ...s, customer_name: customerMap[s.customer_id] || 'Unknown' }));
    },

    async getById(id) {
      const db    = await getDB();
      const sale  = await db.get('sales', id);
      if (!sale) return null;
      const items = await db.getAllFromIndex('sale_items', 'sale_id', id);
      return { ...sale, items };
    },

    async getByCustomerId(customerId) {
      const db      = await getDB();
      const sales   = await db.getAllFromIndex('sales', 'customer_id', customerId);
      const allItems = await db.getAll('sale_items');
      return sales
        .map(s => ({ ...s, items: allItems.filter(i => i.sale_id === s.id) }))
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date));
    },

    async create(saleData, shopId, userId) {
      const db     = await getDB();
      const saleId = generateUUID();
      const now    = new Date().toISOString();

      const totalAmount = saleData.items.reduce(
        (sum, item) => sum + (item.quantity * item.unitPrice), 0
      );
      const paidAmount   = Math.min(Math.max(parseFloat(saleData.paidAmount || 0), 0), totalAmount);
      const bakiAmount   = Math.max(0, totalAmount - paidAmount);
      const paymentStatus =
        bakiAmount  === 0 ? 'paid' :
        paidAmount  === 0 ? 'unpaid' : 'partial';

      const sale = {
        id:             saleId,
        shop_id:        shopId,
        customer_id:    saleData.customerId,
        created_by:     userId,
        total_amount:   totalAmount,
        paid_amount:    paidAmount,
        baki_amount:    bakiAmount,
        payment_status: paymentStatus,
        notes:          saleData.notes || null,
        sale_date:      now,
        created_at:     now,
        _isOffline:     true,
      };
      await db.add('sales', sale);

      // Save sale items + deduct stock locally
      for (const item of saleData.items) {
        await db.add('sale_items', {
          id:           generateUUID(),
          sale_id:      saleId,
          product_id:   item.productId,
          product_name: item.productName || item.name,
          quantity:     item.quantity,
          unit_price:   item.unitPrice,
          total_price:  item.quantity * item.unitPrice,
          created_at:   now,
        });
        // Deduct stock immediately
        await offlineDB.products.adjustStock(item.productId, -item.quantity);
      }

      // Update customer baki immediately
      await offlineDB.customers.updateBalance(saleData.customerId, totalAmount, paidAmount);

      // If partial/full payment — also log a payment record
      if (paidAmount > 0) {
        const payment = {
          id:             generateUUID(),
          shop_id:        shopId,
          customer_id:    saleData.customerId,
          received_by:    userId,
          amount:         paidAmount,
          payment_method: saleData.paymentMethod || 'cash',
          note:           'Payment with sale',
          payment_date:   now,
          created_at:     now,
          sale_id:        saleId,
          _isOffline:     true,
        };
        await db.add('payments', payment);
      }

      await addToSyncQueue(SYNC_ACTIONS.CREATE_SALE, { ...saleData, saleId }, saleId);

      return { ...sale, items: saleData.items };
    },

    async saveFromServer(sales) {
      const db = await getDB();
      const tx = db.transaction('sales', 'readwrite');
      for (const s of sales) await tx.store.put({ ...s, _isOffline: false });
      await tx.done;
    },
  },

  // ── PAYMENTS ────────────────────────────────────────────────────────────────
  payments: {
    async getAll(shopId, filters = {}) {
      const db = await getDB();
      let payments = await db.getAllFromIndex('payments', 'shop_id', shopId);

      if (filters.customerId) {
        payments = payments.filter(p => p.customer_id === filters.customerId);
      }
      if (filters.startDate) {
        payments = payments.filter(p => new Date(p.payment_date) >= new Date(filters.startDate));
      }
      if (filters.endDate) {
        payments = payments.filter(p =>
          new Date(p.payment_date) <= new Date(filters.endDate + 'T23:59:59')
        );
      }

      const customers   = await db.getAllFromIndex('customers', 'shop_id', shopId);
      const customerMap = {};
      customers.forEach(c => { customerMap[c.id] = c.name; });

      return payments
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .map(p => ({ ...p, customer_name: customerMap[p.customer_id] || 'Unknown' }));
    },

    async getByCustomerId(customerId) {
      const db = await getDB();
      return db.getAllFromIndex('payments', 'customer_id', customerId);
    },

    async create(paymentData, shopId, userId) {
      const db     = await getDB();
      const id     = generateUUID();
      const now    = new Date().toISOString();
      const amount = parseFloat(paymentData.amount);

      const payment = {
        id,
        shop_id:        shopId,
        customer_id:    paymentData.customerId,
        received_by:    userId,
        amount,
        payment_method: paymentData.paymentMethod || 'cash',
        note:           paymentData.note || null,
        payment_date:   now,
        created_at:     now,
        _isOffline:     true,
      };
      await db.add('payments', payment);

      // Update customer baki immediately
      await offlineDB.customers.updateBalance(paymentData.customerId, 0, amount);
      const updatedCustomer = await offlineDB.customers.getById(paymentData.customerId);

      await addToSyncQueue(SYNC_ACTIONS.CREATE_PAYMENT, paymentData, id);

      return {
        payment,
        updatedBaki:      updatedCustomer?.baki            || 0,
        updatedTotalPaid: updatedCustomer?.total_paid       || 0,
        customerBaki:     updatedCustomer?.baki             || 0,
      };
    },

    async saveFromServer(payments) {
      const db = await getDB();
      const tx = db.transaction('payments', 'readwrite');
      for (const p of payments) await tx.store.put({ ...p, _isOffline: false });
      await tx.done;
    },
  },

  // ── SUPPLIERS ───────────────────────────────────────────────────────────────
  suppliers: {
    async getAll(shopId) {
      const db = await getDB();
      return db.getAllFromIndex('suppliers', 'shop_id', shopId);
    },

    async getById(id) {
      const db = await getDB();
      return db.get('suppliers', id);
    },

    async create(supplierData, shopId) {
      const db = await getDB();
      const id = generateUUID();
      const supplier = {
        ...supplierData,
        id,
        shop_id:         shopId,
        total_purchased: 0,
        total_paid:      0,
        udharo:          0,
        created_at:      new Date().toISOString(),
        _isOffline:      true,
      };
      await db.add('suppliers', supplier);
      await addToSyncQueue(SYNC_ACTIONS.CREATE_SUPPLIER, supplier, id);
      return supplier;
    },

    async saveFromServer(suppliers) {
      const db = await getDB();
      const tx = db.transaction('suppliers', 'readwrite');
      for (const s of suppliers) await tx.store.put({ ...s, _isOffline: false });
      await tx.done;
    },
  },

  // ── DASHBOARD ───────────────────────────────────────────────────────────────
  dashboard: {
    async getSummary(shopId) {
      const db = await getDB();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      firstOfMonth.setHours(0, 0, 0, 0);

      const [allSales, allPayments, allCustomers, allProducts, allSuppliers] =
        await Promise.all([
          db.getAllFromIndex('sales',     'shop_id', shopId),
          db.getAllFromIndex('payments',  'shop_id', shopId),
          db.getAllFromIndex('customers', 'shop_id', shopId),
          db.getAllFromIndex('products',  'shop_id', shopId),
          db.getAllFromIndex('suppliers', 'shop_id', shopId),
        ]);

      const todaySales      = allSales.filter(s => new Date(s.sale_date) >= today);
      const todaySalesTotal = todaySales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);
      const todayCash       = todaySales.reduce((sum, s) => sum + parseFloat(s.paid_amount  || 0), 0);

      const monthSales = allSales.filter(s => new Date(s.sale_date) >= firstOfMonth);
      const monthTotal = monthSales.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0);

      const totalBaki    = allCustomers.reduce((sum, c) => sum + parseFloat(c.baki || 0), 0);
      const bakiCustomers = allCustomers.filter(c => parseFloat(c.baki || 0) > 0);
      const topBaki       = [...bakiCustomers]
        .sort((a, b) => parseFloat(b.baki) - parseFloat(a.baki))
        .slice(0, 5);

      const customerMap = {};
      allCustomers.forEach(c => { customerMap[c.id] = c.name; });

      const recentSales = allSales
        .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date))
        .slice(0, 5)
        .map(s => ({ type: 'sale', ...s, customer_name: customerMap[s.customer_id] || 'Unknown' }));

      const recentPayments = allPayments
        .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
        .slice(0, 5)
        .map(p => ({ type: 'payment', ...p, customer_name: customerMap[p.customer_id] || 'Unknown' }));

      const recentTransactions = [...recentSales, ...recentPayments]
        .sort((a, b) =>
          new Date(b.sale_date || b.payment_date) -
          new Date(a.sale_date || a.payment_date)
        )
        .slice(0, 10);

      const totalUdharo = allSuppliers.reduce((sum, s) => sum + parseFloat(s.udharo || 0), 0);

      return {
        todaySales: {
          total:         todaySalesTotal,
          count:         todaySales.length,
          cashAmount:    todayCash,
          creditAmount:  todaySalesTotal - todayCash,
        },
        totalBaki: {
          amount:        totalBaki,
          customerCount: bakiCustomers.length,
        },
        topBakiCustomers:  topBaki,
        recentTransactions,
        thisMonthSales: {
          total: monthTotal,
          count: monthSales.length,
        },
        totalCustomers: allCustomers.length,
        totalProducts:  allProducts.length,
        totalUdharo,
        profitSummary: { grossProfit: 0, profitMarginPercent: 0 },
      };
    },
  },
};
