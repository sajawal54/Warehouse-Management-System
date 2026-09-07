import { useState, useCallback } from 'react';
import { aiService } from '../services/aiService';

export const useAI = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chatResponse, setChatResponse] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);

  // Get AI Dashboard Summary
  const loadDashboardSummary = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.getDashboardSummary(params);
      setSummary(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load AI summary';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Run Reconciliation
  const runReconciliation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await aiService.runReconciliation();
      await loadDashboardSummary();
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to run reconciliation';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadDashboardSummary]);

  // Send Chat Message
  const sendChatMessage = useCallback(async (question, warehouseId = null) => {
    setChatLoading(true);
    setChatResponse(null);
    setError(null);
    try {
      const data = await aiService.chat({ question, warehouse_id: warehouseId });
      setChatResponse(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to get AI response';
      setError(msg);
      throw err;
    } finally {
      setChatLoading(false);
    }
  }, []);

  return {
    summary,
    loading,
    error,
    chatResponse,
    chatLoading,
    loadDashboardSummary,
    runReconciliation,
    sendChatMessage,
  };
};