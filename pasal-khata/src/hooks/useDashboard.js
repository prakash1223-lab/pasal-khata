import { useState, useEffect, useCallback } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { dashboardService }   from '../services/dashboardService';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';

export function useDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const { user }               = useAuth();
  const { syncVersion, isOnline } = useNetwork();

  const fetchDashboard = useCallback(async () => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        // Online: get accurate data from server
        const res = await dashboardService.getSummary();
        setData(res.data ?? res);
      } else {
        // Offline: compute from local IndexedDB
        const summary = await offlineDB.dashboard.getSummary(user.shopId);
        setData(summary);
      }
    } catch (err) {
      console.error('useDashboard fetch error:', err.message);
      // Fall back to local computation
      try {
        const summary = await offlineDB.dashboard.getSummary(user.shopId);
        setData(summary);
      } catch {
        setError(err.message || 'Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.shopId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard, syncVersion, isOnline]);

  return { data, loading, error, refetch: fetchDashboard };
}
