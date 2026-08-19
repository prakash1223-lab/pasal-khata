import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(config => {
  const token = localStorage.getItem('pasal_khata_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response interceptor ─────────────────────────────────────────────────────
api.interceptors.response.use(
  // Success: unwrap so callers get { success, data, message, pagination } directly
  response => response.data,

  error => {
    const status  = error.response?.status;
    const message = error.response?.data?.message;

    // 401 — only redirect if the request was NOT to the login endpoints
    if (status === 401) {
      const url = error.config?.url ?? '';
      const isLoginRequest = url.includes('/auth/login') || url.includes('/auth/customer-login');
      if (!isLoginRequest) {
        localStorage.removeItem('pasal_khata_token');
        localStorage.removeItem('pasal_khata_user');
        window.location.href = '/';
      }
      return Promise.reject(new Error(message || 'Session expired. Please login again.'));
    }

    if (status === 403) {
      return Promise.reject(new Error(message || 'Access denied.'));
    }

    if (status === 404) {
      return Promise.reject(new Error(message || 'Not found'));
    }

    if (status === 409) {
      return Promise.reject(new Error(message || 'Duplicate entry'));
    }

    if (status === 500) {
      return Promise.reject(new Error(message || 'Server error. Please try again.'));
    }

    // No response at all — network error
    if (!error.response) {
      return Promise.reject(new Error('Cannot connect to server. Check your internet connection.'));
    }

    return Promise.reject(new Error(message || 'Something went wrong'));
  }
);

export default api;
