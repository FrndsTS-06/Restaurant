import { request } from './api';

export const createOrder = async (orderPayload) => {
  return await request('/orders', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  });
};

export const getOrderById = async (orderId, verifyEmail = '') => {
  const query = verifyEmail ? `?email=${encodeURIComponent(verifyEmail)}` : '';
  return await request(`/orders/${orderId}${query}`);
};

export const getMyOrders = async (email) => {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return await request(`/orders/my-orders${query}`);
};

export const getAllOrders = async (status) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return await request(`/orders${query}`);
};

export const updateOrderStatus = async (orderId, status, note = '') => {
  return await request(`/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, note })
  });
};

export const cancelOrder = async (orderId, reason = 'Cancelled by customer') => {
  return await request(`/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};
