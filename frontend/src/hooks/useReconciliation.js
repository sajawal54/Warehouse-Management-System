import { useState } from 'react';
import { reconciliationService } from '../services/reconciliationService';

export const useReconciliation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const runReconciliation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await reconciliationService.run();
      setResult(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to run reconciliation';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    result,
    runReconciliation,
  };
};