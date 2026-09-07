import api from '../api/axios';

export const salesService = {
  getAll: async () => {
    const response = await api.get('/sales/sales_orders');
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/sales/sales_orders/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/sales/sales_orders', data);
    return response.data;
  },

  submit: async (id) => {
    const response = await api.patch(`/sales/sales_orders/${id}/submit`);
    return response.data;
  },

  // ✅ FIXED: Correct URL for fulfill
  fulfill: async (id, data) => {
    const response = await api.post(`/sales/sales-orders/${id}/fulfill`, data);
    return response.data;
  },

  cancel: async (id) => {
    const response = await api.patch(`/sales/sales_orders/${id}/cancel`);
    return response.data;
  },
};