import { useState, useEffect, useCallback } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';

export function useCustomerDetail(customerId) {
  const [customer,     setCustomer]     = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const { user }               = useAuth();
  const { updatePendingCount } = useNetwork();

  const fetchAll = useCallback(async () => {
    if (!customerId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [cust, sales, payments] = await Promise.all([
        offlineDB.customers.getById(customerId),
        offlineDB.sales.getByCustomerId(customerId),
        offlineDB.payments.getByCustomerId(customerId),
      ]);

      if (!cust) { setError('Customer not found'); return; }

      setCustomer(cust);

      // Merge sales + payments into unified timeline
      const txns = [
        ...sales.map(s   => ({ ...s, type: 'sale',    date: s.sale_date    })),
        ...payments.map(p => ({ ...p, type: 'payment', date: p.payment_date })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(txns);
    } catch (err) {
      console.error('useCustomerDetail fetch error:', err.message);
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const receivePayment = useCallback(async (paymentData) => {
    const result = await offlineDB.payments.create(
      { ...paymentData, customerId },
      user.shopId,
      user.id
    );

    // Optimistically update customer baki
    setCustomer(prev => prev ? {
      ...prev,
      baki:       result.updatedBaki,
      total_paid: result.updatedTotalPaid,
      _isOffline: true,
    } : null);

    // Prepend to timeline
    setTransactions(prev => [{
      ...result.payment,
      type: 'payment',
      date: result.payment.payment_date,
    }, ...prev]);

    await updatePendingCount();
    return result;
  }, [customerId, user?.shopId, user?.id, updatePendingCount]);

  return { customer, transactions, loading, error, refetch: fetchAll, receivePayment };
}
