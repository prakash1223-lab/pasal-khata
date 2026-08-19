import { useState, useEffect, useCallback, useRef } from 'react';
import { supplierService } from '../services/supplierService';

export function useSuppliers() {
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [search,     setSearch]     = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const debounceRef = useRef(null);

  const fetchSuppliers = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await supplierService.getAll({
        search: params.search ?? search,
        page:   params.page   ?? 1,
        limit:  50,
        ...params,
      });
      setSuppliers(res.data ?? []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      console.error('useSuppliers fetch error:', err.message);
      setError(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuppliers({ search }), 400);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const createSupplier = useCallback(async (data) => {
    const res = await supplierService.create(data);
    const newS = res.data ?? res;
    setSuppliers(prev => [newS, ...prev]);
    return newS;
  }, []);

  const updateSupplier = useCallback(async (id, data) => {
    const res = await supplierService.update(id, data);
    const updated = res.data ?? res;
    setSuppliers(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  }, []);

  const deleteSupplier = useCallback(async (id) => {
    await supplierService.delete(id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    suppliers, loading, error, search, setSearch, pagination,
    refetch: fetchSuppliers, createSupplier, updateSupplier, deleteSupplier,
  };
}
