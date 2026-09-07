import api from '../api/axios';

export const inventoryService = {
  // Receive stock (Staff+)
  receive: async (data) => {
    const response = await api.post('/inventory/receive', data);
    return response.data;
  },

  // Get all inventory movements (Viewer+)
  getMovements: async () => {
    const response = await api.get('/inventory/movements');
    return response.data;
  },
};