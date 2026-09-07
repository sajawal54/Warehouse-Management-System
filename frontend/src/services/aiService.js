import api from '../api/axios';

export const aiService = {
  // Get AI Dashboard Summary (Viewer+)
  getDashboardSummary: async (params = {}) => {
    const response = await api.get('/ai/dashboard/summary', { params });
    return response.data;
  },

  // Run Reconciliation & AI Analysis (Manager+)
  runReconciliation: async () => {
    const response = await api.post('/ai/reconciliation/run');
    return response.data;
  },

  // Chat with AI (Viewer+)
  chat: async (data) => {
    const response = await api.post('/ai/chat', data);
    return response.data;
  },
};