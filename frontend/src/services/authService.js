import axios from 'axios';
import api from '../api/axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const authService = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (userData) => {
    const response = await axios.post(`${API_URL}/auth/register`, userData);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // ✅ Get current user from backend
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // ✅ Update profile
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // ✅ Change password
  changePassword: async (data) => {
    const response = await api.post('/auth/change-password', data);
    return response.data;
  },
};