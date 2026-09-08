import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { tokenUtils } from '../utils/token';
import axios from '../api/axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = tokenUtils.getUser();
      const token = tokenUtils.getAccessToken();
      
      if (storedUser && token) {
        const decoded = tokenUtils.decodeToken(token);
        if (decoded && decoded.exp) {
          const expiry = new Date(decoded.exp * 1000);
          const now = new Date();
          
          if (now < expiry) {
            setUser(storedUser);
          } else {
            try {
              const refreshToken = tokenUtils.getRefreshToken();
              if (refreshToken) {
                const response = await axios.post('/auth/refresh', {
                  refresh_token: refreshToken,
                });
                const { access_token, refresh_token } = response.data;
                tokenUtils.setTokens(access_token, refresh_token);
                setUser(storedUser);
              } else {
                // No refresh token logout
                tokenUtils.clearTokens();
                setUser(null);
              }
            } catch (error) {
              // Refresh failed logout
              tokenUtils.clearTokens();
              setUser(null);
            }
          }
        } else {
          setUser(storedUser);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { access_token, refresh_token } = response;

      tokenUtils.setTokens(access_token, refresh_token);
      
      const decoded = tokenUtils.decodeToken(access_token);
      
      const userInfo = {
        email: decoded.sub,
        role: decoded.role,
        username: decoded.sub?.split('@')[0] || 'User',
      };

      tokenUtils.setUser(userInfo);
      setUser(userInfo);

      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          const updatedUserInfo = {
            email: userData.email,
            role: userData.role,
            username: userData.username || userData.email?.split('@')[0] || 'User',
            id: userData.id,
          };
          tokenUtils.setUser(updatedUserInfo);
          setUser(updatedUserInfo);
        }
      } catch (err) {
        console.log('Using token data for user');
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      const msg = error.response?.data?.detail || 'Login failed';
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    try {
      await authService.register(userData);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: msg };
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      
      const userData = {
        id: response.id,
        email: response.email,
        role: response.role,
        username: response.username || response.email?.split('@')[0] || 'User',
      };
      
      tokenUtils.setUser(userData);
      setUser(userData);
      
      return userData;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  };

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (!Array.isArray(allowedRoles)) {
      allowedRoles = [allowedRoles];
    }
    return allowedRoles.includes(user.role);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
    isAuthenticated: !!user && tokenUtils.isAuthenticated(),
    userRole: user?.role || null,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};