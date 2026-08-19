import { openDB } from 'idb';

const DB_NAME    = 'pasal_khata_local';
const DB_VERSION = 1;

let db = null;

export async function initLocalDB() {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // customers
      if (!database.objectStoreNames.contains('customers')) {
        const s = database.createObjectStore('customers', { keyPath: 'id' });
        s.createIndex('shop_id', 'shop_id');
        s.createIndex('name',    'name');
        s.createIndex('phone',   'phone');
      }

      // products
      if (!database.objectStoreNames.contains('products')) {
        const s = database.createObjectStore('products', { keyPath: 'id' });
        s.createIndex('shop_id', 'shop_id');
        s.createIndex('name',    'name');
      }

      // sales
      if (!database.objectStoreNames.contains('sales')) {
        const s = database.createObjectStore('sales', { keyPath: 'id' });
        s.createIndex('shop_id',     'shop_id');
        s.createIndex('customer_id', 'customer_id');
        s.createIndex('sale_date',   'sale_date');
      }

      // sale_items
      if (!database.objectStoreNames.contains('sale_items')) {
        const s = database.createObjectStore('sale_items', { keyPath: 'id' });
        s.createIndex('sale_id', 'sale_id');
      }

      // payments
      if (!database.objectStoreNames.contains('payments')) {
        const s = database.createObjectStore('payments', { keyPath: 'id' });
        s.createIndex('shop_id',     'shop_id');
        s.createIndex('customer_id', 'customer_id');
      }

      // suppliers
      if (!database.objectStoreNames.contains('suppliers')) {
        const s = database.createObjectStore('suppliers', { keyPath: 'id' });
        s.createIndex('shop_id', 'shop_id');
      }

      // purchases
      if (!database.objectStoreNames.contains('purchases')) {
        const s = database.createObjectStore('purchases', { keyPath: 'id' });
        s.createIndex('shop_id',     'shop_id');
        s.createIndex('supplier_id', 'supplier_id');
      }

      // purchase_items
      if (!database.objectStoreNames.contains('purchase_items')) {
        const s = database.createObjectStore('purchase_items', { keyPath: 'id' });
        s.createIndex('purchase_id', 'purchase_id');
      }

      // sync_queue — persists across app closes
      if (!database.objectStoreNames.contains('sync_queue')) {
        const s = database.createObjectStore('sync_queue', {
          keyPath:       'id',
          autoIncrement: true,
        });
        s.createIndex('status',     'status');
        s.createIndex('created_at', 'created_at');
      }

      // meta — last_synced timestamps etc.
      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'key' });
      }
    },
  });

  return db;
}

export async function getDB() {
  if (!db) await initLocalDB();
  return db;
}

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
