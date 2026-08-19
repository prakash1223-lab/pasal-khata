import { useState, useEffect, useCallback } from 'react';
import { offlineDB }  from '../db/offlineDataLayer';
import { useAuth }    from '../context/AuthContext';
import { useNetwork } from '../context/NetworkContext';

export function useDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const { user } = useAuth();
  const { syncVersion } = useNetwork();

  const fetchDashboard = useCallback(async () => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      const summary = await offlineDB.dashboard.getSummary(user.shopId);
      setData(summary);
    } catch (err) {
      console.error('useDashboard fetch error:', err.message);
      setError(err.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [user?.shopId]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard, syncVersion]);

  return { data, loading, error, refetch: fetchDashboard };
}
