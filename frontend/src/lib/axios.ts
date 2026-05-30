import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://shadowchat-backend-e9yu.onrender.com/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ✅ ONLY redirect on 401 — not on 500, network errors, or timeouts
    // Also guard against redirect loops: don't redirect if already on '/'
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      window.location.pathname !== '/'
    ) {
      console.warn('[Axios] 401 received — clearing session and redirecting');
      localStorage.removeItem('accessToken');
      document.cookie =
        'auth-session-flag=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);
