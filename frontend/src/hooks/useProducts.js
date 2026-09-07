import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);  // ✅ Add this
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load products (for paginated list)
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAll();
      setProducts(data || []);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load products';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ ADD THIS - Load ALL products for dropdowns
  const loadAllProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getAll();
      setAllProducts(data || []);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load all products';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await productService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Product not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.create(data);
      await loadProducts();
      await loadAllProducts();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create product';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadAllProducts]);

  const updateProduct = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await productService.update(id, data);
      await loadProducts();
      await loadAllProducts();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update product';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadAllProducts]);

  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await productService.delete(id);
      await loadProducts();
      await loadAllProducts();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete product';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadProducts, loadAllProducts]);

  useEffect(() => {
    loadProducts();
    loadAllProducts();
  }, []);

  return {
    products,
    allProducts,  // ✅ Return allProducts
    loading,
    error,
    loadProducts,
    loadAllProducts,  // ✅ Return loadAllProducts
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
  };
};