/**
 * Sync Engine
 * Pushes pending offline actions to the server.
 * Called when internet reconnects or every 30 seconds when online.
 */
import api from '../services/api';
import {
  getPendingItems,
  updateSyncStatus,
  clearSyncedItems,
  SYNC_STATUS,
  SYNC_ACTIONS,
} from './syncQueue';
import { getDB }        from './localDB';
import { offlineDB }    from './offlineDataLayer';

let isSyncing = false;

export async function syncToServer() {
  if (isSyncing) {
    console.log('⏳ Sync already in progress...');
    return { synced: 0, failed: 0 };
  }
  isSyncing = true;
  console.log('🔄 Starting sync to server...');

  try {
    const pendingItems = await getPendingItems();
    if (pendingItems.length === 0) {
      console.log('✅ Nothing to sync');
      return { synced: 0, failed: 0 };
    }

    console.log(`📤 Syncing ${pendingItems.length} pending item(s)...`);
    let synced = 0;
    let failed = 0;

    for (const item of pendingItems) {
      try {
        await updateSyncStatus(item.id, SYNC_STATUS.SYNCING);
        await processQueueItem(item);
        await updateSyncStatus(item.id, SYNC_STATUS.SYNCED);
        synced++;
        console.log(`  ✅ Synced: ${item.action}`);
      } catch (err) {
        console.error(`  ❌ Failed to sync ${item.action}:`, err.message);
        await updateSyncStatus(item.id, SYNC_STATUS.FAILED, err.message);
        failed++;
        if ((item.retryCount || 0) >= (item.maxRetries || 5)) {
          console.error(`  🚫 Max retries reached for ${item.action}`);
        }
      }
    }

    await clearSyncedItems();
    console.log(`✅ Sync done — synced: ${synced}, failed: ${failed}`);
    return { synced, failed };

  } finally {
    isSyncing = false;
  }
}

async function processQueueItem(item) {
  const { action, data } = item;
  const db = await getDB();

  switch (action) {

    case SYNC_ACTIONS.CREATE_CUSTOMER: {
      const res = await api.post('/customers', {
        name:           data.name,
        phone:          data.phone,
        address:        data.address,
        zone:           data.zone,
        area:           data.area,
        street_address: data.street_address,
        landmark:       data.landmark,
      });
      const serverCustomer = res.data ?? res;
      if (item.localId) {
        const local = await db.get('customers', item.localId);
        if (local) {
          await db.delete('customers', item.localId);
          await db.put('customers', { ...local, ...serverCustomer, _isOffline: false });
        }
      }
      break;
    }

    case SYNC_ACTIONS.UPDATE_CUSTOMER: {
      await api.put(`/customers/${data.id}`, data);
      const customer = await db.get('customers', data.id);
      if (customer) await db.put('customers', { ...customer, _isOffline: false });
      break;
    }

    case SYNC_ACTIONS.CREATE_SALE: {
      const res = await api.post('/sales', {
        customerId: data.customerId,
        items:      data.items.map(i => ({
          productId:   i.productId,
          productName: i.productName || i.name,
          quantity:    i.quantity,
          unitPrice:   i.unitPrice,
        })),
        paidAmount: data.paidAmount,
        notes:      data.notes,
      });
      const serverSale = res.data?.sale ?? res.data ?? res;
      if (item.localId) {
        const local = await db.get('sales', item.localId);
        if (local) {
          await db.delete('sales', item.localId);
          await db.put('sales', { ...serverSale, _isOffline: false });
        }
      }
      break;
    }

    case SYNC_ACTIONS.CREATE_PAYMENT: {
      const res = await api.post('/payments', {
        customerId:    data.customerId,
        amount:        data.amount,
        paymentMethod: data.paymentMethod,
        note:          data.note,
      });
      const serverPayment = res.data?.payment ?? res.data ?? res;
      if (serverPayment?.id) {
        await db.put('payments', { ...serverPayment, _isOffline: false });
      }
      break;
    }

    case SYNC_ACTIONS.CREATE_PRODUCT: {
      const res = await api.post('/products', {
        name:          data.name,
        category:      data.category,
        price:         data.price,
        costPrice:     data.cost_price,
        stockQuantity: data.stock_quantity,
        unit:          data.unit,
      });
      const serverProduct = res.data ?? res;
      if (item.localId) {
        const local = await db.get('products', item.localId);
        if (local) {
          await db.delete('products', item.localId);
          await db.put('products', { ...serverProduct, _isOffline: false });
        }
      }
      break;
    }

    case SYNC_ACTIONS.UPDATE_PRODUCT: {
      await api.put(`/products/${data.id}`, data);
      const product = await db.get('products', data.id);
      if (product) await db.put('products', { ...product, _isOffline: false });
      break;
    }

    case SYNC_ACTIONS.CREATE_SUPPLIER: {
      const res = await api.post('/suppliers', {
        name:    data.name,
        phone:   data.phone,
        address: data.address,
        email:   data.email,
      });
      const serverSupplier = res.data ?? res;
      if (item.localId) {
        const local = await db.get('suppliers', item.localId);
        if (local) {
          await db.delete('suppliers', item.localId);
          await db.put('suppliers', { ...serverSupplier, _isOffline: false });
        }
      }
      break;
    }

    case SYNC_ACTIONS.UPDATE_SUPPLIER: {
      await api.put(`/suppliers/${data.id}`, data);
      const supplier = await db.get('suppliers', data.id);
      if (supplier) await db.put('suppliers', { ...supplier, _isOffline: false });
      break;
    }

    case SYNC_ACTIONS.CREATE_PURCHASE: {
      await api.post('/purchases', data);
      break;
    }

    default:
      console.warn(`⚠️ Unknown sync action: ${action}`);
  }
}

/** Pull all data from server into local IndexedDB */
export async function fullSyncFromServer(shopId) {
  console.log('📥 Full sync from server starting...');
  try {
    const [customersRes, productsRes, salesRes, paymentsRes, suppliersRes] =
      await Promise.all([
        api.get('/customers', { params: { limit: 1000 } }),
        api.get('/products',  { params: { limit: 1000 } }),
        api.get('/sales',     { params: { limit: 500  } }),
        api.get('/payments',  { params: { limit: 500  } }),
        api.get('/suppliers', { params: { limit: 1000 } }),
      ]);

    const customers = customersRes.data ?? customersRes ?? [];
    const products  = productsRes.data  ?? productsRes  ?? [];
    const sales     = salesRes.data     ?? salesRes     ?? [];
    const payments  = paymentsRes.data  ?? paymentsRes  ?? [];
    const suppliers = suppliersRes.data ?? suppliersRes ?? [];

    console.log(`📥 Received — customers:${customers.length} products:${products.length} sales:${sales.length} payments:${payments.length} suppliers:${suppliers.length}`);

    await offlineDB.customers.saveFromServer(Array.isArray(customers) ? customers : []);
    await offlineDB.products.saveFromServer(Array.isArray(products)   ? products  : []);
    await offlineDB.sales.saveFromServer(Array.isArray(sales)         ? sales     : []);
    await offlineDB.payments.saveFromServer(Array.isArray(payments)   ? payments  : []);
    await offlineDB.suppliers.saveFromServer(Array.isArray(suppliers) ? suppliers : []);

    // Verify what's in IndexedDB after save
    const db = await getDB();
    const savedCustomers = await db.getAll('customers');
    console.log(`✅ Full sync done — ${savedCustomers.length} customers in IndexedDB`);
    return true;
  } catch (err) {
    console.error('❌ Full sync failed:', err.message, err);
    return false;
  }
}
