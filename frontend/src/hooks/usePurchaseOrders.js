import { useState, useEffect, useCallback } from 'react';
import { purchaseService } from '../services/purchaseService';

export const usePurchaseOrders = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load all purchase orders
  const loadPurchaseOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseService.getAll();
      setPurchaseOrders(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load purchase orders';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single purchase order
  const getPurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await purchaseService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Purchase order not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create purchase order (Staff+)
  const createPurchaseOrder = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await purchaseService.create(data);
      await loadPurchaseOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create purchase order';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPurchaseOrders]);

  // Submit purchase order (Manager+)
  const submitPurchaseOrder = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await purchaseService.submit(id);
      await loadPurchaseOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit purchase order';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPurchaseOrders]);

  // Receive stock against purchase order (Staff+)
  const receivePurchaseOrder = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await purchaseService.receive(id, data);
      await loadPurchaseOrders();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to receive stock';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadPurchaseOrders]);

  useEffect(() => {
    loadPurchaseOrders();
  }, [loadPurchaseOrders]);

  return {
    purchaseOrders,
    loading,
    error,
    loadPurchaseOrders,
    getPurchaseOrder,
    createPurchaseOrder,
    submitPurchaseOrder,
    receivePurchaseOrder,
  };
};