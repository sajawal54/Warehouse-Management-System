import { useState, useEffect, useCallback } from 'react';
import { adjustmentService } from '../services/adjustmentService';

export const useAdjustments = () => {
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadAdjustments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adjustmentService.getAll();
      setAdjustments(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load adjustments';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAdjustment = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adjustmentService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Adjustment not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createAdjustment = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adjustmentService.create(data);
      await loadAdjustments();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create adjustment';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAdjustments]);

  useEffect(() => {
    loadAdjustments();
  }, [loadAdjustments]);

  return {
    adjustments,
    loading,
    error,
    loadAdjustments,
    getAdjustment,
    createAdjustment,
  };
};