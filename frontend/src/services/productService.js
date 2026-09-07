import api from '../api/axios';

export const productService = {
  // Get all products (Viewer+)
  getAll: async () => {
    const response = await api.get('/products/get');
    return response.data;
  },

  // Get product by ID (Viewer+)
  getById: async (id) => {
    const response = await api.get(`/products/get/${id}`);
    return response.data;
  },

  // Create product (Manager+)
  create: async (data) => {
    const response = await api.post('/products/create', data);
    return response.data;
  },

  // Update product (Manager+)
  update: async (id, data) => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Delete product (Admin only)
  delete: async (id) => {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  },
};