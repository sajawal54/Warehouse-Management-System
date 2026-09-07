import api from '../api/axios';

export const adjustmentService = {
  // Get all adjustments (Viewer+)
  getAll: async () => {
    const response = await api.get('/adjustments/stock_adjustments/');
    return response.data;
  },

  // Get adjustment by ID (Viewer+)
  getById: async (id) => {
    const response = await api.get(`/adjustments/stock_adjustments/${id}`);
    return response.data;
  },

  // Create adjustment (Staff+)
  create: async (data) => {
    const response = await api.post('/adjustments/stock_adjustments/', data);
    return response.data;
  },
};