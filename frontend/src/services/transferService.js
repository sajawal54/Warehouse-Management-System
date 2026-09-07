import api from '../api/axios';

export const transferService = {
  // Get all transfers (Viewer+)
  getAll: async () => {
    const response = await api.get('/stock_transfer/');
    return response.data;
  },

  // Get transfer by ID (Viewer+)
  getById: async (id) => {
    const response = await api.get(`/stock_transfer/${id}`);
    return response.data;
  },

  // Create transfer (Staff+)
  create: async (data) => {
    const response = await api.post('/stock_transfer/', data);
    return response.data;
  },

  // Complete transfer (Staff+)
  complete: async (id) => {
    const response = await api.post(`/stock_transfer/${id}/complete`);
    return response.data;
  },
};