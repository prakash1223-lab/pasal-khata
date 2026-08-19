import { useState, useEffect, useCallback } from 'react';
import { supplierService } from '../services/supplierService';

export function useSupplierDetail(id) {
  const [supplier,     setSupplier]     = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  const fetchAll = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await supplierService.getTransactions(id);
      const d   = res.data ?? res;
      setSupplier(d.supplier ?? null);
      setTransactions(d.timeline ?? []);
    } catch (err) {
      console.error('useSupplierDetail fetch error:', err.message);
      setError(err.message || 'Failed to load supplier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const payUdharo = useCallback(async (data) => {
    const res = await supplierService.payUdharo(id, data);
    const d   = res.data ?? res;
    // Optimistically update supplier udharo
    setSupplier(prev => prev ? {
      ...prev,
      udharo:     d.supplierUdharo ?? Math.max(0, parseFloat(prev.udharo ?? 0) - parseFloat(data.amount)),
      total_paid: parseFloat(prev.total_paid ?? 0) + parseFloat(data.amount),
    } : prev);
    // Prepend payment to timeline
    setTransactions(prev => [{
      id:             `pay-${Date.now()}`,
      type:           'payment',
      date:           new Date().toISOString(),
      payment_date:   new Date().toISOString(),
      amount:         data.amount,
      payment_method: data.paymentMethod ?? 'cash',
      note:           data.note ?? null,
    }, ...prev]);
    return d;
  }, [id]);

  return { supplier, transactions, loading, error, refetch: fetchAll, payUdharo };
}
