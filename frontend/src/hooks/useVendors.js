import { useState, useEffect, useCallback } from 'react';
import { vendorService } from '../services/vendorService';

export const useVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await vendorService.getAll();
      setVendors(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load vendors';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getVendor = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const data = await vendorService.getById(id);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Vendor not found';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVendor = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vendorService.create(data);
      await loadVendors();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create vendor';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadVendors]);

  const updateVendor = useCallback(async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await vendorService.update(id, data);
      await loadVendors();
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update vendor';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadVendors]);

  const deleteVendor = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await vendorService.delete(id);
      await loadVendors();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to delete vendor';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadVendors]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  return {
    vendors,
    loading,
    error,
    loadVendors,
    getVendor,
    createVendor,
    updateVendor,
    deleteVendor,
  };
};