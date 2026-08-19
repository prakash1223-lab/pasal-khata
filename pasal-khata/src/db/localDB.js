import { openDB, deleteDB } from 'idb';

const DB_NAME    = 'pasal_khata_local';
const DB_VERSION = 2; // bump to force wipe of v1 stale data

let db = null;

export async function initLocalDB() {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion) {
      // v1 → v2: wipe all stores and recreate clean
      // This clears any stale/wrong data from before the offline system was built
      if (oldVersion < 2) {
        const existing = Array.from(database.objectStoreNames);
        for (const name of existing) {
          database.deleteObjectStore(name);
        }
        console.log('🔄 IndexedDB upgraded v1→v2: all stores cleared for fresh sync');
      }

      // customers
      const customers = database.createObjectStore('customers', { keyPath: 'id' });
      customers.createIndex('shop_id', 'shop_id');
      customers.createIndex('name',    'name');
      customers.createIndex('phone',   'phone');

      // products
      const products = database.createObjectStore('products', { keyPath: 'id' });
      products.createIndex('shop_id', 'shop_id');
      products.createIndex('name',    'name');

      // sales
      const sales = database.createObjectStore('sales', { keyPath: 'id' });
      sales.createIndex('shop_id',     'shop_id');
      sales.createIndex('customer_id', 'customer_id');
      sales.createIndex('sale_date',   'sale_date');

      // sale_items
      const saleItems = database.createObjectStore('sale_items', { keyPath: 'id' });
      saleItems.createIndex('sale_id', 'sale_id');

      // payments
      const payments = database.createObjectStore('payments', { keyPath: 'id' });
      payments.createIndex('shop_id',     'shop_id');
      payments.createIndex('customer_id', 'customer_id');

      // suppliers
      const suppliers = database.createObjectStore('suppliers', { keyPath: 'id' });
      suppliers.createIndex('shop_id', 'shop_id');

      // purchases
      const purchases = database.createObjectStore('purchases', { keyPath: 'id' });
      purchases.createIndex('shop_id',     'shop_id');
      purchases.createIndex('supplier_id', 'supplier_id');

      // purchase_items
      const purchaseItems = database.createObjectStore('purchase_items', { keyPath: 'id' });
      purchaseItems.createIndex('purchase_id', 'purchase_id');

      // sync_queue — persists offline actions across app closes
      const syncQueue = database.createObjectStore('sync_queue', {
        keyPath:       'id',
        autoIncrement: true,
      });
      syncQueue.createIndex('status',     'status');
      syncQueue.createIndex('created_at', 'created_at');

      // meta — last_synced timestamps, version flags etc.
      database.createObjectStore('meta', { keyPath: 'key' });
    },

    blocked() {
      console.warn('IndexedDB upgrade blocked — close other tabs and reload');
    },

    blocking() {
      // Another tab is trying to upgrade — close our connection
      db?.close();
      db = null;
    },
  });

  return db;
}

export async function getDB() {
  if (!db) await initLocalDB();
  return db;
}

/** Wipe all data stores but keep the DB structure intact */
export async function clearAllLocalData() {
  const database = await getDB();
  const stores = [
    'customers', 'products', 'sales', 'sale_items',
    'payments',  'suppliers', 'purchases', 'purchase_items',
    'sync_queue',
  ];
  const tx = database.transaction(stores, 'readwrite');
  for (const store of stores) {
    await tx.objectStore(store).clear();
  }
  await tx.done;
  console.log('🗑️ All local data cleared');
}

/** Nuclear option — delete the entire DB (used for logout / account switch) */
export async function deleteLocalDB() {
  db?.close();
  db = null;
  await deleteDB(DB_NAME);
  console.log('💣 Local DB deleted');
}
