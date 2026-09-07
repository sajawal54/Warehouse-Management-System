import api from '../api/axios';

export const adminService = {
  // Get all users (Admin only)
  getUsers: async () => {
    const response = await api.get('/admin/users');
    return response.data;
  },

  // Create user (Admin only)
  createUser: async (data) => {
    const response = await api.post('/admin/users', data);
    return response.data;
  },

  // Update user role (Admin only)
  updateUserRole: async (userId, role) => {
    const response = await api.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Delete user (Admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },
};