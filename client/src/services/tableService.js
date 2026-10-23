import { request } from './api';

export const getAllTables = async (params = {}) => {
  const cleanParams = new URLSearchParams();
  Object.keys(params).forEach(k => {
    if (params[k] !== undefined && params[k] !== null && params[k] !== '' && params[k] !== 'All') {
      cleanParams.append(k, params[k]);
    }
  });
  const queryString = cleanParams.toString();
  return await request(`/tables${queryString ? `?${queryString}` : ''}`);
};

export const getTableById = async (id) => {
  return await request(`/tables/${id}`);
};

export const createTable = async (tableData) => {
  return await request('/tables', {
    method: 'POST',
    body: JSON.stringify(tableData)
  });
};

export const updateTable = async (id, tableData) => {
  return await request(`/tables/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tableData)
  });
};

export const toggleBlockTable = async (id, isBlocked, blockedReason = '') => {
  return await request(`/tables/${id}/block`, {
    method: 'PATCH',
    body: JSON.stringify({ isBlocked, blockedReason })
  });
};

export const deleteTable = async (id) => {
  return await request(`/tables/${id}`, {
    method: 'DELETE'
  });
};
