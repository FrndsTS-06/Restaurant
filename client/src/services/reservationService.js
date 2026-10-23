import { request } from './api';

export const getReservationAvailability = async (date, guestsCount = 2) => {
  return await request(`/reservations/availability?date=${encodeURIComponent(date)}&guestsCount=${guestsCount}`);
};

export const createReservation = async (reservationData) => {
  return await request('/reservations', {
    method: 'POST',
    body: JSON.stringify(reservationData)
  });
};

export const getMyReservations = async (email) => {
  const query = email ? `?email=${encodeURIComponent(email)}` : '';
  return await request(`/reservations/my-reservations${query}`);
};

export const cancelReservation = async (id, reason = 'Cancelled by guest') => {
  return await request(`/reservations/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};

export const getAllReservations = async (params = {}) => {
  const cleanParams = new URLSearchParams();
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'All') {
      cleanParams.append(k, params[k]);
    }
  });
  const queryString = cleanParams.toString();
  return await request(`/reservations${queryString ? `?${queryString}` : ''}`);
};

export const updateReservationStatus = async (id, status, tableNumber, cancellationReason) => {
  return await request(`/reservations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, tableNumber, cancellationReason })
  });
};
