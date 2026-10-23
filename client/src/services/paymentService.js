import { request } from './api';

// Dynamically load Razorpay checkout SDK
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const getPaymentConfig = async () => {
  return await request('/payments/config');
};

export const createPaymentOrder = async (orderPayload) => {
  return await request('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify(orderPayload)
  });
};

export const verifyPaymentSignature = async (verificationPayload) => {
  return await request('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(verificationPayload)
  });
};

export const recordPaymentFailure = async (failurePayload) => {
  return await request('/payments/record-failure', {
    method: 'POST',
    body: JSON.stringify(failurePayload)
  });
};
