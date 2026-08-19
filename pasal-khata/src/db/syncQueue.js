import { getDB } from './localDB';

export const SYNC_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  SYNCED:  'synced',
  FAILED:  'failed',
};

export const SYNC_ACTIONS = {
  CREATE_CUSTOMER:       'CREATE_CUSTOMER',
  UPDATE_CUSTOMER:       'UPDATE_CUSTOMER',
  DELETE_CUSTOMER:       'DELETE_CUSTOMER',
  CREATE_SALE:           'CREATE_SALE',
  CREATE_PAYMENT:        'CREATE_PAYMENT',
  CREATE_PRODUCT:        'CREATE_PRODUCT',
  UPDATE_PRODUCT:        'UPDATE_PRODUCT',
  CREATE_SUPPLIER:       'CREATE_SUPPLIER',
  UPDATE_SUPPLIER:       'UPDATE_SUPPLIER',
  CREATE_PURCHASE:       'CREATE_PURCHASE',
  CREATE_SUPPLIER_PAYMENT: 'CREATE_SUPPLIER_PAYMENT',
};

export async function addToSyncQueue(action, data, localId = null) {
  const db   = await getDB();
  const item = {
    action,
    data,
    localId,
    status:     SYNC_STATUS.PENDING,
    retryCount: 0,
    maxRetries: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const id = await db.add('sync_queue', item);
  console.log(`📥 Queued: ${action} (queue id: ${id})`);
  return id;
}

export async function getPendingItems() {
  const db    = await getDB();
  const items = await db.getAllFromIndex('sync_queue', 'status', SYNC_STATUS.PENDING);
  return items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
}

export async function updateSyncStatus(id, status, error = null) {
  const db   = await getDB();
  const item = await db.get('sync_queue', id);
  if (!item) return;
  item.status     = status;
  item.updated_at = new Date().toISOString();
  if (error)                         item.lastError  = error;
  if (status === SYNC_STATUS.FAILED) item.retryCount = (item.retryCount || 0) + 1;
  await db.put('sync_queue', item);
}

export async function getPendingCount() {
  const items = await getPendingItems();
  return items.length;
}

export async function clearSyncedItems() {
  const db  = await getDB();
  const all = await db.getAll('sync_queue');
  let count = 0;
  for (const item of all) {
    if (item.status === SYNC_STATUS.SYNCED) {
      await db.delete('sync_queue', item.id);
      count++;
    }
  }
  if (count > 0) console.log(`🧹 Cleared ${count} synced items from queue`);
}
