import { request } from './api';

export const loginUser = async (email, password) => {
  return await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
};

export const registerUser = async (name, email, password, phone) => {
  return await request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, phone })
  });
};

export const logoutUser = async (refreshToken) => {
  return await request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });
};

export const refreshTokenUser = async (refreshToken) => {
  return await request('/auth/refresh-token', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  });
};

export const getProfile = async () => {
  return await request('/auth/profile');
};

export const updateProfile = async (profileData) => {
  return await request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData)
  });
};

export const changePassword = async (currentPassword, newPassword) => {
  return await request('/auth/change-password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword })
  });
};

export const forgotPassword = async (email) => {
  return await request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

export const resetPassword = async (token, newPassword) => {
  return await request(`/auth/reset-password/${token}`, {
    method: 'POST',
    body: JSON.stringify({ newPassword })
  });
};
