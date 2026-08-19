import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineDB }          from '../db/offlineDataLayer';
import { productService }     from '../services/productService';
import { useAuth }            from '../context/AuthContext';
import { useNetwork }         from '../context/NetworkContext';

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [search,   setSearch]   = useState('');

  const { user }               = useAuth();
  const { updatePendingCount } = useNetwork();
  const debounceRef            = useRef(null);

  const fetchProducts = useCallback(async (q = '') => {
    if (!user?.shopId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await offlineDB.products.getAll(user.shopId, { search: q });
      setProducts(data);
    } catch (err) {
      console.error('useProducts fetch error:', err.message);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [user?.shopId]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(search), 300);
    return () => clearTimeout(debounceRef.current);
  }, [search, fetchProducts]);

  const createProduct = useCallback(async (data) => {
    const product = await offlineDB.products.create(data, user.shopId);
    setProducts(prev => [product, ...prev]);
    await updatePendingCount();
    return product;
  }, [user?.shopId, updatePendingCount]);

  const updateProduct = useCallback(async (id, data) => {
    const product = await offlineDB.products.update(id, data);
    setProducts(prev => prev.map(p => p.id === id ? product : p));
    await updatePendingCount();
    return product;
  }, [updatePendingCount]);

  const deleteProduct = useCallback(async (id) => {
    await offlineDB.products.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    if (navigator.onLine) {
      productService.delete(id).catch(console.error);
    }
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
