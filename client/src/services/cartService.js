import { request } from './api';

export const getCart = async () => {
  return await request('/cart');
};

export const addItemToCart = async (menuItemId, quantity = 1, specialInstructions = '') => {
  return await request('/cart/items', {
    method: 'POST',
    body: JSON.stringify({ menuItemId, quantity, specialInstructions })
  });
};

export const updateCartItem = async (itemId, quantity, specialInstructions) => {
  return await request(`/cart/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify({ quantity, specialInstructions })
  });
};

export const removeCartItem = async (itemId) => {
  return await request(`/cart/items/${itemId}`, {
    method: 'DELETE'
  });
};

export const updateCartOrderType = async (orderType) => {
  return await request('/cart/order-type', {
    method: 'PUT',
    body: JSON.stringify({ orderType })
  });
};

export const applyCoupon = async (code) => {
  return await request('/cart/apply-coupon', {
    method: 'POST',
    body: JSON.stringify({ code })
  });
};

export const mergeCart = async (sessionId) => {
  return await request('/cart/merge', {
    method: 'POST',
    body: JSON.stringify({ sessionId })
  });
};

export const clearCart = async () => {
  return await request('/cart', {
    method: 'DELETE'
  });
};
