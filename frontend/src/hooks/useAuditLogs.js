import { useState, useCallback } from 'react';
import { auditService } from '../services/auditService';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadLogs = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await auditService.getAll(params);
      setLogs(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load audit logs';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    error,
    loadLogs,
  };
};