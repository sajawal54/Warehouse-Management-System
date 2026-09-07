import api from '../api/axios';

export const vendorService = {
  // Get all vendors (Viewer+)
  getAll: async () => {
    const response = await api.get('/vendors/get');
    return response.data;
  },

  // Get vendor by ID (Viewer+)
  getById: async (id) => {
    const response = await api.get(`/vendors/get/${id}`);
    return response.data;
  },

  // Create vendor (Manager+)
  create: async (data) => {
    const response = await api.post('/vendors/create', data);
    return response.data;
  },

  // Update vendor (Manager+)
  update: async (id, data) => {
    const response = await api.put(`/vendors/update/${id}`, data);
    return response.data;
  },

  // Delete vendor (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/vendors/delete/${id}`);
    return response.data;
  },
};