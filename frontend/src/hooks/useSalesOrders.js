import { useState, useEffect, useCallback } from 'react';
import { salesService } from '../services/saleService';

export const useSalesOrders = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSalesOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesService.getAll();
      setSalesOrders(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load sales orders';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getSalesOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await salesService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Sales order not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createSalesOrder = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await salesService.create(data);
      await loadSalesOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create sales order';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSalesOrders]);

  const submitSalesOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await salesService.submit(id);
      await loadSalesOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit sales order';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSalesOrders]);

  const fulfillSalesOrder = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await salesService.fulfill(id, data);
      await loadSalesOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to fulfill sales order';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSalesOrders]);

  const cancelSalesOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await salesService.cancel(id);
      await loadSalesOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to cancel sales order';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadSalesOrders]);

  useEffect(() => {
    loadSalesOrders();
  }, [loadSalesOrders]);

  return {
    salesOrders,
    loading,
    error,
    loadSalesOrders,
    getSalesOrder,
    createSalesOrder,
    submitSalesOrder,
    fulfillSalesOrder,
    cancelSalesOrder,
  };
};