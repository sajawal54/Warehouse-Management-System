import { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/authService';
import { tokenUtils } from '../utils/token';

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
    const storedUser = tokenUtils.getUser();
    if (storedUser && tokenUtils.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      const { access_token, refresh_token } = response;

      // ✅ FIRST: Set the tokens
      tokenUtils.setTokens(access_token, refresh_token);
      
      // ✅ SECOND: Decode the token to get user info
      const decoded = tokenUtils.decodeToken(access_token);
      
      // ✅ THIRD: Create user info from decoded token
      const userInfo = {
        email: decoded.sub,
        role: decoded.role,
        username: decoded.sub?.split('@')[0] || 'User',
      };

      // ✅ Store user info
      tokenUtils.setUser(userInfo);
      setUser(userInfo);

      // ✅ FOURTH: Optionally fetch fresh user data (token is now set)
      try {
        const userData = await authService.getCurrentUser();
        // ✅ Update with fresh data if needed
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
        // If getCurrentUser fails, we already have user info from token
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