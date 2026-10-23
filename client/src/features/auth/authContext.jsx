import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  getProfile,
  updateProfile as updateProfileApi,
  changePassword as changePasswordApi
} from '../../services/authService';
import { mergeCart } from '../../services/cartService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('savoria_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('savoria_auth_token') || null);
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('savoria_refresh_token') || null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Sync profile from backend on mount if token exists
  const syncProfile = useCallback(async () => {
    if (!token) {
      setInitialLoading(false);
      return;
    }
    try {
      const res = await getProfile();
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('savoria_user', JSON.stringify(res.data));
      }
    } catch (err) {
      if (err.status === 401) {
        setUser(null);
        setToken(null);
        setRefreshToken(null);
        localStorage.removeItem('savoria_auth_token');
        localStorage.removeItem('savoria_refresh_token');
        localStorage.removeItem('savoria_user');
      }
    } finally {
      setInitialLoading(false);
    }
  }, [token]);

  useEffect(() => {
    syncProfile();
  }, [syncProfile]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await loginUser(email, password);
      const { token: receivedToken, refreshToken: receivedRefresh, user: userData } = response.data;

      setToken(receivedToken);
      setRefreshToken(receivedRefresh);
      setUser(userData);

      localStorage.setItem('savoria_auth_token', receivedToken);
      if (receivedRefresh) {
        localStorage.setItem('savoria_refresh_token', receivedRefresh);
      }
      localStorage.setItem('savoria_user', JSON.stringify(userData));

      // Merge guest cart if session ID exists
      const sessionId = localStorage.getItem('savoria_session_id');
      if (sessionId) {
        try {
          await mergeCart(sessionId);
        } catch (mergeErr) {
          console.warn('Guest cart merge notice:', mergeErr.message);
        }
      }

      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: err.message, status: err.status };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password, phone) => {
    setLoading(true);
    try {
      const response = await registerUser(name, email, password, phone);
      const { token: receivedToken, refreshToken: receivedRefresh, user: userData } = response.data;

      setToken(receivedToken);
      setRefreshToken(receivedRefresh);
      setUser(userData);

      localStorage.setItem('savoria_auth_token', receivedToken);
      if (receivedRefresh) {
        localStorage.setItem('savoria_refresh_token', receivedRefresh);
      }
      localStorage.setItem('savoria_user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (err) {
      return { success: false, message: err.message, status: err.status };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      const currentRefresh = refreshToken || localStorage.getItem('savoria_refresh_token');
      if (currentRefresh) {
        await logoutUser(currentRefresh).catch(() => {});
      }
    } finally {
      setUser(null);
      setToken(null);
      setRefreshToken(null);
      localStorage.removeItem('savoria_auth_token');
      localStorage.removeItem('savoria_refresh_token');
      localStorage.removeItem('savoria_user');
    }
  };

  const updateProfile = async (profileData) => {
    setLoading(true);
    try {
      const res = await updateProfileApi(profileData);
      setUser(res.data);
      localStorage.setItem('savoria_user', JSON.stringify(res.data));
      return { success: true, user: res.data };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    setLoading(true);
    try {
      await changePasswordApi(currentPassword, newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff' || user?.role === 'admin';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        refreshToken,
        isAdmin,
        isStaff,
        isCustomer,
        loading,
        initialLoading,
        login,
        register,
        logout,
        syncProfile,
        updateProfile,
        changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
