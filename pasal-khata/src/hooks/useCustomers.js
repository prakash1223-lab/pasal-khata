import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { customerService }    from '../services/customerService';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';
import { isNetworkError }     from '../utils/networkCheck';

export function useCustomers(initialParams = {}) {
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });

  const { user }               = useAuth();
  const { updatePendingCount, syncVersion, isOnline } = useNetwork();
  const debounceRef            = useRef(null);

  const fetchCustomers = useCallback(async (params = {}) => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        // Online: always fetch fresh from server
        const res = await customerService.getAll({
          search: params.search ?? search,
          page:   params.page ?? 1,
          limit:  200,
          ...params,
        });
        const data = res.data ?? [];
        setCustomers(data);
        if (res.pagination) setPagination(res.pagination);
        // Keep IndexedDB in sync
        offlineDB.customers.saveFromServer(data).catch(() => {});
      } else {
        // Offline: read from IndexedDB
        const data = await offlineDB.customers.getAll(user.shopId, {
          search: params.search ?? search,
        });
        setCustomers(data);
        setPagination({ page: 1, total: data.length, totalPages: 1 });
      }
    } catch (err) {
      console.error('useCustomers fetch error:', err.message);
      // On error, fall back to IndexedDB
      try {
        const data = await offlineDB.customers.getAll(user.shopId, {
          search: params.search ?? search,
        });
        setCustomers(data);
      } catch {
        setError(err.message || 'Failed to load customers');
      }
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

  // Re-fetch on mount, online status change, or sync
  useEffect(() => {
    if (user?.shopId) fetchCustomers();
  }, [user?.shopId, isOnline, syncVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const createCustomer = useCallback(async (data) => {
    if (navigator.onLine) {
      try {
        const res = await customerService.create(data);
        const customer = res.data ?? res;
        await offlineDB.customers.saveFromServer([customer]).catch(() => {});
        setCustomers(prev => [customer, ...prev]);
        return customer;
      } catch (err) {
        // Server unreachable (Render cold start / no connection) — save offline
        if (isNetworkError(err)) {
          const customer = await offlineDB.customers.create(data, user.shopId);
          setCustomers(prev => [customer, ...prev]);
          await updatePendingCount();
          return customer;
        }
        throw err;
      }
    } else {
      const customer = await offlineDB.customers.create(data, user.shopId);
      setCustomers(prev => [customer, ...prev]);
      await updatePendingCount();
      return customer;
    }
  }, [user?.shopId, updatePendingCount]);

  const updateCustomer = useCallback(async (id, data) => {
    if (navigator.onLine) {
      const res = await customerService.update(id, data);
      const updated = res.data ?? res;
      await offlineDB.customers.saveFromServer([updated]).catch(() => {});
      setCustomers(prev => prev.map(c => c.id === id ? updated : c));
      return updated;
    } else {
      const updated = await offlineDB.customers.update(id, data);
      setCustomers(prev => prev.map(c => c.id === id ? updated : c));
      await updatePendingCount();
      return updated;
    }
  }, [updatePendingCount]);

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
