import api from '../api/axios';

export const reconciliationService = {

  run: async () => {
    const response = await api.post('/reconciliation/run-reconciliation');
    return response.data;
  },

  getResults: async () => {
    const response = await api.get('/reconciliation/results');
    return response.data;
  },
};