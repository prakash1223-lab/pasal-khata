/**
 * useCustomerDetail
 * For owner/staff: reads from IndexedDB (offline-first).
 * For customer role (MyKhata): always reads from server to ensure correct data.
 */
import { useState, useEffect, useCallback } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { customerService }    from '../services/customerService';
import { paymentService }     from '../services/paymentService';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';

export function useCustomerDetail(customerId) {
  const [customer,     setCustomer]     = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const { user }               = useAuth();
  const { updatePendingCount } = useNetwork();
  const isCustomerRole         = user?.role === 'customer';

  const fetchAll = useCallback(async () => {
    if (!customerId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      if (isCustomerRole) {
        // Customer (MyKhata): always fetch from server for accurate data
        // Fall back to localStorage user data if offline
        if (!navigator.onLine) {
          setCustomer({
            id:              user.id,
            name:            user.name,
            phone:           user.phone,
            baki:            0,
            total_purchased: 0,
            total_paid:      0,
          });
          setTransactions([]);
          return;
        }
        const [custRes, txRes] = await Promise.all([
          customerService.getById(customerId),
          customerService.getTransactions(customerId),
        ]);
        setCustomer(custRes.data ?? custRes);
        const txData = txRes.data ?? txRes;
        setTransactions(Array.isArray(txData) ? txData : (txData.timeline ?? []));
      } else {
        // Owner/staff: read from IndexedDB (offline-first)
        const [cust, sales, payments] = await Promise.all([
          offlineDB.customers.getById(customerId),
          offlineDB.sales.getByCustomerId(customerId),
          offlineDB.payments.getByCustomerId(customerId),
        ]);

        if (!cust) { setError('Customer not found'); return; }

        setCustomer(cust);

        const txns = [
          ...sales.map(s   => ({ ...s, type: 'sale',    date: s.sale_date    })),
          ...payments.map(p => ({ ...p, type: 'payment', date: p.payment_date })),
        ].sort((a, b) => new Date(b.date) - new Date(a.date));

        setTransactions(txns);
      }
    } catch (err) {
      console.error('useCustomerDetail fetch error:', err.message);
      setError(err.message || 'Failed to load customer');
    } finally {
      setLoading(false);
    }
  }, [customerId, isCustomerRole]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const receivePayment = useCallback(async (paymentData) => {
    if (isCustomerRole) {
      // Customer can't create payments
      throw new Error('Not allowed');
    }
    const result = await offlineDB.payments.create(
      { ...paymentData, customerId },
      user.shopId,
      user.id
    );

    setCustomer(prev => prev ? {
      ...prev,
      baki:       result.updatedBaki,
      total_paid: result.updatedTotalPaid,
      _isOffline: true,
    } : null);

    setTransactions(prev => [{
      ...result.payment,
      type: 'payment',
      date: result.payment.payment_date,
    }, ...prev]);

    await updatePendingCount();
    return result;
  }, [customerId, isCustomerRole, user?.shopId, user?.id, updatePendingCount]);

  return { customer, transactions, loading, error, refetch: fetchAll, receivePayment };
}
