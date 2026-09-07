import { useState, useEffect, useCallback } from 'react';
import { inventoryService } from '../services/inventoryService';

export const useInventory = () => {
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Receive stock
  const receiveStock = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryService.receive(data);
      await loadMovements(); // Refresh movements after receiving
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to receive stock';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ✅ Load all movements
  const loadMovements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await inventoryService.getMovements();
      setMovements(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load movements';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  return {
    movements,
    loading,
    error,
    receiveStock,
    loadMovements,
  };
};