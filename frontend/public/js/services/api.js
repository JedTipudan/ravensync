const API_BASE = '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('rs_token');
  const { timeout = 15000, body, headers: extraHeaders, ...fetchOptions } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const config = {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...extraHeaders,
    },
    signal: controller.signal,
  };

  if (body !== undefined) {
    config.body = typeof body === 'object' ? JSON.stringify(body) : body;
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    clearTimeout(timer);
    const data = await res.json();
    if (res.status === 401 && !endpoint.includes('/auth/login')) {
      localStorage.removeItem('rs_token');
      localStorage.removeItem('rs_user');
      window.location.href = '/login';
      return;
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError') throw new Error('Request timed out');
    throw error;
  }
}

export const api = {
  get: (url, params) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`${url}${query}`);
  },
  post: (url, body, opts = {}) => apiRequest(url, { method: 'POST', body, ...opts }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body }),
  patch: (url, body) => apiRequest(url, { method: 'PATCH', body }),
  delete: (url) => apiRequest(url, { method: 'DELETE' }),
};
