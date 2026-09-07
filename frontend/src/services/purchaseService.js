import api from '../api/axios';

export const purchaseService = {
  // Get all purchase orders (Viewer+)
  getAll: async () => {
    const response = await api.get('/purchase/');
    return response.data;
  },

  // Get purchase order by ID (Viewer+)
  getById: async (id) => {
    const response = await api.get(`/purchase/${id}`);
    return response.data;
  },

  // Create purchase order (Staff+)
  create: async (data) => {
    const response = await api.post('/purchase/', data);
    return response.data;
  },

  // Submit purchase order (Manager+)
  submit: async (id) => {
    const response = await api.patch(`/purchase/${id}/submit`);
    return response.data;
  },

  // Receive stock against purchase order (Staff+)
  receive: async (id, data) => {
    const response = await api.post(`/purchase/${id}/receive`, data);
    return response.data;
  },
};