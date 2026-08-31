// Token & Role Management Utility
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_ROLE_KEY = 'user_role';

export const getAccessToken = () => {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getUserRole = () => {
    return localStorage.getItem(USER_ROLE_KEY) || 'viewer';
};

export const setTokens = (accessToken, refreshToken) => {
    if (accessToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    }
    if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
};

export const setUserRole = (role) => {
    if (role) {
        localStorage.setItem(USER_ROLE_KEY, role);
    }
};

// Ek sath tokens aur role save karne ke liye helper function
export const setAuthData = (accessToken, refreshToken, role) => {
    setTokens(accessToken, refreshToken);
    if (role) {
        setUserRole(role);
    }
};

export const clearTokens = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
};

export const isAuthenticated = () => {
    return !!getAccessToken();
};