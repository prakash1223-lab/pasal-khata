import { useState, useEffect, useCallback } from 'react';
import dayjs             from 'dayjs';
import { offlineDB }     from '../db/offlineDataLayer';
import { useAuth }       from '../context/AuthContext';
import { useNetwork }    from '../context/NetworkContext';

function getDateRange(filter) {
  const now = dayjs();
  if (filter === 'today') return { startDate: now.format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  if (filter === 'week')  return { startDate: now.subtract(6, 'day').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  if (filter === 'month') return { startDate: now.startOf('month').format('YYYY-MM-DD'), endDate: now.format('YYYY-MM-DD') };
  return {};
}

export function usePayments(filter = 'week') {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const { user }               = useAuth();
  const { updatePendingCount } = useNetwork();

  const fetchPayments = useCallback(async () => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await offlineDB.payments.getAll(user.shopId, getDateRange(filter));
      setPayments(data);
    } catch (err) {
      console.error('usePayments fetch error:', err.message);
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  }, [user?.shopId, filter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const createPayment = useCallback(async (data) => {
    const result = await offlineDB.payments.create(data, user.shopId, user.id);
    setPayments(prev => [result.payment, ...prev]);
    await updatePendingCount();
    return result;
  }, [user?.shopId, user?.id, updatePendingCount]);

  return { payments, loading, error, refetch: fetchPayments, createPayment };
}
