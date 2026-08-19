import { useState, useEffect, useCallback } from 'react';
import dayjs                 from 'dayjs';
import { offlineDB }         from '../db/offlineDataLayer';
import { saleService }       from '../services/saleService';
import { syncToServer }      from '../db/syncEngine';
import { useAuth }           from '../context/AuthContext';
import { useNetwork }        from '../context/NetworkContext';

function getDateRange(filter) {
  const now = dayjs();
  if (filter === 'today') return { startDate: now.format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  if (filter === 'week')  return { startDate: now.subtract(6, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  if (filter === 'month') return { startDate: now.startOf('month').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  return {};
}

export function useSales(filter = 'week') {
  const [sales,   setSales]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const { user }               = useAuth();
  const { updatePendingCount, syncVersion, isOnline } = useNetwork();

  const fetchSales = useCallback(async () => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        const res  = await saleService.getAll({ ...getDateRange(filter), limit: 200 });
        const data = res.data ?? [];
        setSales(data);
        offlineDB.sales.saveFromServer(data).catch(() => {});
      } else {
        const data = await offlineDB.sales.getAll(user.shopId, getDateRange(filter));
        setSales(data);
      }
    } catch (err) {
      console.error('useSales fetch error:', err.message);
      try {
        const data = await offlineDB.sales.getAll(user.shopId, getDateRange(filter));
        setSales(data);
      } catch {
        setError(err.message || 'Failed to load sales');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.shopId, filter]);

  useEffect(() => { fetchSales(); }, [fetchSales, syncVersion, isOnline]);

  const createSale = useCallback(async (data) => {
    // Sales always go through offlineDB (handles stock + baki updates locally)
    const sale = await offlineDB.sales.create(data, user.shopId, user.id);
    setSales(prev => [sale, ...prev]);
    await updatePendingCount();
    // If online, immediately sync
    if (navigator.onLine) {
      syncToServer().catch(() => {});
    }
    return sale;
  }, [user?.shopId, user?.id, updatePendingCount]);

  return { sales, loading, error, refetch: fetchSales, createSale };
}
