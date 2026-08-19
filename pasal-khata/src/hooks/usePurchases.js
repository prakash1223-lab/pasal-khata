import { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import { purchaseService } from '../services/purchaseService';

function getDateRange(filter) {
  const now = dayjs();
  if (filter === 'today') return { startDate: now.format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  if (filter === 'week')  return { startDate: now.subtract(6, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  if (filter === 'month') return { startDate: now.startOf('month').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  return {};
}

export function usePurchases(filter = 'week') {
  const [purchases, setPurchases] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await purchaseService.getAll({ ...getDateRange(filter), limit: 100 });
      setPurchases(res.data ?? []);
    } catch (err) {
      console.error('usePurchases fetch error:', err.message);
      setError(err.message || 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPurchases(); }, [fetchPurchases]);

  const createPurchase = useCallback(async (data) => {
    const res      = await purchaseService.create(data);
    const purchase = res.data?.purchase ?? res.data ?? res;
    setPurchases(prev => [purchase, ...prev]);
    return res.data ?? res;
  }, []);

  return { purchases, loading, error, refetch: fetchPurchases, createPurchase };
}
