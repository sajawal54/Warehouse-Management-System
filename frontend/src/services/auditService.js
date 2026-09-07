import api from '../api/axios';

export const auditService = {
  // Get all audit logs (Manager+)
  getAll: async (params = {}) => {
    const response = await api.get('/audit/', { params });
    return response.data;
  },
};