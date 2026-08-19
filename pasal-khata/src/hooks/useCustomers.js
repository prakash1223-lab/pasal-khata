import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { customerService }    from '../services/customerService';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';

export function useCustomers(initialParams = {}) {
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const { user }               = useAuth();
  const { updatePendingCount, syncVersion } = useNetwork();
  const debounceRef            = useRef(null);

  const fetchCustomers = useCallback(async (params = {}) => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await offlineDB.customers.getAll(user.shopId, {
        search: params.search ?? search,
        ...params,
      });
      setCustomers(data);
      setPagination({ page: 1, total: data.length, totalPages: 1 });
    } catch (err) {
      console.error('useCustomers fetch error:', err.message);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [user?.shopId, search]);

  // Debounce search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchCustomers({ search }), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load + re-fetch when syncVersion bumps (after fullSyncFromServer)
  useEffect(() => {
    if (user?.shopId) fetchCustomers();
  }, [user?.shopId, syncVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const createCustomer = useCallback(async (data) => {
    const customer = await offlineDB.customers.create(data, user.shopId);
    setCustomers(prev => [customer, ...prev]);
    await updatePendingCount();
    return customer;
  }, [user?.shopId, updatePendingCount]);

  const updateCustomer = useCallback(async (id, data) => {
    const updated = await offlineDB.customers.update(id, data);
    setCustomers(prev => prev.map(c => c.id === id ? updated : c));
    await updatePendingCount();
    return updated;
  }, [updatePendingCount]);

  // Delete is intentionally not offline-supported (high risk) — server only
  const deleteCustomer = useCallback(async (id) => {
    await customerService.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  return {
    customers,
    loading,
    error,
    search,
    setSearch,
    pagination,
    refetch:        fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
