import { createSlice } from '@reduxjs/toolkit';

const initialUser = (() => {
  try {
    const stored = localStorage.getItem('savoria_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
})();

const initialToken = localStorage.getItem('savoria_auth_token') || null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    isAdmin: initialUser?.role === 'admin',
    isLoading: false,
    error: null
  },
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAdmin = user?.role === 'admin';
      state.error = null;
      localStorage.setItem('savoria_user', JSON.stringify(user));
      localStorage.setItem('savoria_auth_token', token);
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAdmin = false;
      state.error = null;
      localStorage.removeItem('savoria_user');
      localStorage.removeItem('savoria_auth_token');
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setAuthError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    }
  }
});

export const { setCredentials, logout, setAuthLoading, setAuthError } = authSlice.actions;
export default authSlice.reducer;
