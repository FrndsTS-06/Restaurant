import { request, API_BASE } from './api';

// 1. Dashboard & Analytics
export const getAdminAnalytics = async () => {
  return await request('/admin/analytics');
};

// 2. Customers
export const getAdminCustomers = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await request(`/admin/customers${query ? `?${query}` : ''}`);
};

export const getAdminCustomerById = async (id) => {
  return await request(`/admin/customers/${id}`);
};

export const updateCustomerStatus = async (id, data) => {
  return await request(`/admin/customers/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });
};

// 3. Staff Management
export const getAdminStaff = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await request(`/admin/staff${query ? `?${query}` : ''}`);
};

export const createAdminStaff = async (data) => {
  return await request('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const updateAdminStaff = async (id, data) => {
  return await request(`/admin/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const deleteAdminStaff = async (id) => {
  return await request(`/admin/staff/${id}`, {
    method: 'DELETE'
  });
};

// 4. Payments
export const getAdminPayments = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await request(`/admin/payments${query ? `?${query}` : ''}`);
};

export const refundAdminPayment = async (id, data) => {
  return await request(`/admin/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

// 5. Reports
export const getAdminReport = async (type, params = {}) => {
  const query = new URLSearchParams(params).toString();
  return await request(`/admin/reports/${type}${query ? `?${query}` : ''}`);
};

export const downloadReportCsv = async (type, params = {}) => {
  const query = new URLSearchParams({ ...params, format: 'csv' }).toString();
  const token = localStorage.getItem('savoria_auth_token');
  const res = await fetch(`${API_BASE}/admin/reports/${type}?${query}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` })
    }
  });
  if (!res.ok) {
    throw new Error('Failed to download CSV export');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// 6. Settings
export const getRestaurantSettings = async () => {
  return await request('/settings');
};

export const updateRestaurantSettings = async (data) => {
  return await request('/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};
