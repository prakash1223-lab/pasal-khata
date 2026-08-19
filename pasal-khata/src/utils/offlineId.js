/**
 * Offline ID utilities
 * When offline we generate local IDs so the UI works normally.
 * After sync the server replaces them with real UUIDs.
 */

export function generateOfflineId() {
  return 'offline-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

export function isOfflineId(id) {
  return typeof id === 'string' && id.startsWith('offline-');
}

/** RFC-4122 v4 UUID for local records that need a stable UUID shape */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
