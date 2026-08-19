import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { syncToServer, fullSyncFromServer } from '../db/syncEngine';
import { getPendingCount } from '../db/syncQueue';

const NetworkContext = createContext(null);

export function NetworkProvider({ children }) {
  const [isOnline,      setIsOnline]      = useState(navigator.onLine);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [isSyncing,     setIsSyncing]     = useState(false);
  const [lastSynced,    setLastSynced]    = useState(
    () => localStorage.getItem('last_synced') || null
  );
  // Increments every time a full server sync completes — hooks watch this to re-fetch
  const [syncVersion,   setSyncVersion]   = useState(0);

  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  const performSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await syncToServer();
      if (result.synced > 0) {
        const now = new Date().toISOString();
        setLastSynced(now);
        localStorage.setItem('last_synced', now);
      }
      await updatePendingCount();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, updatePendingCount]);

  const triggerFullSync = useCallback(async (shopId) => {
    const ok = await fullSyncFromServer(shopId);
    if (ok) {
      setSyncVersion(v => v + 1); // signal all hooks to re-fetch from IndexedDB
      await updatePendingCount();
    }
    return ok;
  }, [updatePendingCount]);

  // Load pending count on mount
  useEffect(() => {
    updatePendingCount();
  }, [updatePendingCount]);

  // Listen for online/offline
  useEffect(() => {
    const handleOnline = async () => {
      console.log('🌐 Internet connected — syncing...');
      setIsOnline(true);
      // First push any pending offline actions
      await performSync();
      // Then pull fresh data from server into IndexedDB cache
      const session = localStorage.getItem('pasal_khata_user');
      if (session) {
        try {
          const userData = JSON.parse(session);
          if (userData.shopId) {
            const ok = await fullSyncFromServer(userData.shopId);
            if (ok) setSyncVersion(v => v + 1);
          }
        } catch { /* ignore */ }
      }
    };
    const handleOffline = () => {
      console.log('📴 Offline mode active');
      setIsOnline(false);
    };
    window.addEventListener('online',  handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online',  handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [performSync]);

  // Background sync every 30 seconds when online
  useEffect(() => {
    if (!isOnline) return;
    const interval = setInterval(performSync, 30_000);
    return () => clearInterval(interval);
  }, [isOnline, performSync]);

  return (
    <NetworkContext.Provider value={{
      isOnline,
      pendingCount,
      isSyncing,
      lastSynced,
      syncVersion,
      performSync,
      updatePendingCount,
      fullSyncFromServer: triggerFullSync,
    }}>
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork must be used inside NetworkProvider');
  return ctx;
}
