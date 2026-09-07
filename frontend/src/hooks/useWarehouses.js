import { useState, useEffect, useCallback } from 'react';
import { warehouseService } from '../services/warehouseService';

export const useWarehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehouseService.getAll();
      setWarehouses(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load warehouses';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getWarehouse = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await warehouseService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Warehouse not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createWarehouse = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseService.create(data);
      await loadWarehouses();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create warehouse';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouses]);

  const updateWarehouse = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await warehouseService.update(id, data);
      await loadWarehouses();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update warehouse';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouses]);

  const deleteWarehouse = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await warehouseService.delete(id);
      await loadWarehouses();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete warehouse';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadWarehouses]);

  useEffect(() => {
    loadWarehouses();
  }, [loadWarehouses]);

  return {
    warehouses,
    loading,
    error,
    loadWarehouses,
    getWarehouse,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
};