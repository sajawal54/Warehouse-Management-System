import api from '../api/axios';

export const warehouseService = {
  // Get all warehouses (Viewer+)
  getAll: async () => {
    const response = await api.get('/warehouses/get');
    return response.data;
  },

  // Get warehouse by ID (Viewer+)
  getById: async (id) => {
    const response = await api.get(`/warehouses/get/${id}`);
    return response.data;
  },

  // Create warehouse (Manager+)
  create: async (data) => {
    const response = await api.post('/warehouses/create', data);
    return response.data;
  },

  // Update warehouse (Manager+)
  update: async (id, data) => {
    const response = await api.put(`/warehouses/update/${id}`, data);
    return response.data;
  },

  // Delete warehouse (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/warehouses/delete/${id}`);
    return response.data;
  },
};