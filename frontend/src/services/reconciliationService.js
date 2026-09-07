import api from '../api/axios';

export const reconciliationService = {
  // Run reconciliation (Manager+)
  run: async () => {
    const response = await api.post('/reconciliation/run-reconciliation');
    return response.data;
  },
};