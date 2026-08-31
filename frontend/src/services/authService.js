import axios from 'axios';
import { getAccessToken, setAuthData, clearTokens } from './tokenSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor for Token Injection
api.interceptors.request.use(
    (config) => {
        const token = getAccessToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Register API
export const registerUser = async (userData) => {
    try {
        const response = await api.post('/auth/register', userData);
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || 'Registration failed';
    }
};

// Login API (Role handling ke sath updated)
export const loginUser = async (usernameOrEmail, password) => {
    try {
        const formData = new URLSearchParams();
        formData.append('username', usernameOrEmail);
        formData.append('password', password);

        const response = await api.post('/auth/login', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        // Agar response mein access token maujood hai
        if (response.data.access_token) {
            // Backend se aane wala role extract karein (misal ke tor par response.data.role ya response.data.user?.role)
            const userRole = response.data.role || response.data.user_role || 'viewer';
            
            // Tokens aur Role dono ek sath save ho jayenge
            setAuthData(
                response.data.access_token, 
                response.data.refresh_token, 
                userRole
            );
        }
        return response.data;
    } catch (error) {
        throw error.response?.data?.detail || 'Invalid credentials or login failed';
    }
};

export const logoutUser = () => {
    clearTokens();
    window.location.href = '/login';
};

export default api;