import { useState, useEffect, useCallback } from 'react';
import { transferService } from '../services/transferService';

export const useTransfers = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await transferService.getAll();
      setTransfers(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load transfers';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransfer = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await transferService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Transfer not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createTransfer = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await transferService.create(data);
      await loadTransfers();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create transfer';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTransfers]);

  const completeTransfer = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const result = await transferService.complete(id);
      await loadTransfers();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to complete transfer';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadTransfers]);

  useEffect(() => {
    loadTransfers();
  }, [loadTransfers]);

  return {
    transfers,
    loading,
    error,
    loadTransfers,
    getTransfer,
    createTransfer,
    completeTransfer,
  };
};