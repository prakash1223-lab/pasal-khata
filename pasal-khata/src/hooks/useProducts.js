import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { productService }     from '../services/productService';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';
import { isNetworkError }     from '../utils/networkCheck';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');

  const { user }               = useAuth();
  const { updatePendingCount, syncVersion, isOnline } = useNetwork();
  const debounceRef            = useRef(null);

  const fetchProducts = useCallback(async (q = '') => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      if (navigator.onLine) {
        const res = await productService.getAll({ search: q, limit: 500 });
        const data = res.data ?? [];
        setProducts(data);
        offlineDB.products.saveFromServer(data).catch(() => {});
      } else {
        const data = await offlineDB.products.getAll(user.shopId, { search: q });
        setProducts(data);
      }
    } catch (err) {
      console.error('useProducts fetch error:', err.message);
      try {
        const data = await offlineDB.products.getAll(user.shopId, { search: q });
        setProducts(data);
      } catch {
        setError(err.message || 'Failed to load products');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.shopId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchProducts, syncVersion, isOnline]);

  const createProduct = useCallback(async (data) => {
    if (navigator.onLine) {
      try {
        const res = await productService.create(data);
        const product = res.data ?? res;
        await offlineDB.products.saveFromServer([product]).catch(() => {});
        setProducts(prev => [product, ...prev]);
        return product;
      } catch (err) {
        if (isNetworkError(err)) {
          const product = await offlineDB.products.create(data, user.shopId);
          setProducts(prev => [product, ...prev]);
          await updatePendingCount();
          return product;
        }
        throw err;
      }
    } else {
      const product = await offlineDB.products.create(data, user.shopId);
      setProducts(prev => [product, ...prev]);
      await updatePendingCount();
      return product;
    }
  }, [user?.shopId, updatePendingCount]);

  const updateProduct = useCallback(async (id, data) => {
    if (navigator.onLine) {
      const res = await productService.update(id, data);
      const product = res.data ?? res;
      await offlineDB.products.saveFromServer([product]).catch(() => {});
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      return product;
    } else {
      const product = await offlineDB.products.update(id, data);
      setProducts(prev => prev.map(p => p.id === id ? product : p));
      await updatePendingCount();
      return product;
    }
  }, [updatePendingCount]);

  const deleteProduct = useCallback(async (id) => {
    await productService.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    // Soft delete in IndexedDB too
    offlineDB.products.delete(id).catch(() => {});
  }, []);

  return {
    products,
    loading,
    error,
    search,
    setSearch,
    refetch:       () => fetchProducts(search),
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
