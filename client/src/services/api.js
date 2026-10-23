export const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const request = async (endpoint, options = {}, isRetry = false) => {
  const token = localStorage.getItem('savoria_auth_token');
  let sessionId = localStorage.getItem('savoria_session_id');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now();
    localStorage.setItem('savoria_session_id', sessionId);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    'x-session-id': sessionId,
    ...options.headers
  };

  const config = {
    ...options,
    credentials: 'include', // Support HTTP-only cookies
    headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await res.json();

    // Check if token expired and needs automatic refresh
    if (res.status === 401 && !isRetry && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
      const storedRefreshToken = localStorage.getItem('savoria_refresh_token');
      if (storedRefreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh-token`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: storedRefreshToken })
          });
          const refreshData = await refreshRes.json();
          if (refreshRes.ok && refreshData.data?.token) {
            localStorage.setItem('savoria_auth_token', refreshData.data.token);
            if (refreshData.data.refreshToken) {
              localStorage.setItem('savoria_refresh_token', refreshData.data.refreshToken);
            }
            // Retry original request with newly rotated token
            return await request(endpoint, options, true);
          }
        } catch {
          // Token refresh failed - proceed with session expiration
          localStorage.removeItem('savoria_auth_token');
          localStorage.removeItem('savoria_refresh_token');
          localStorage.removeItem('savoria_user');
        }
      }
    }

    if (!res.ok) {
      const err = new Error(data.message || 'API request failed');
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (!endpoint.includes('/auth/login')) {
      console.warn(`API [${endpoint}]:`, err.message);
    }
    throw err;
  }
};
