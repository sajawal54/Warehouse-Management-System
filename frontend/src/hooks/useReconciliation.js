import { useState, useEffect, useCallback } from 'react';
import { reconciliationService } from '../services/reconciliationService';

export const useReconciliation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  // Load reconciliation results
  const loadResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reconciliationService.getResults();
      setResults(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load reconciliation results';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Run reconciliation
  const runReconciliation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reconciliationService.run();
      await loadResults(); // Refresh results after running
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to run reconciliation';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  return {
    loading,
    error,
    results,
    runReconciliation,
    loadResults,
  };
};