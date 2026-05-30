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
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Redirecting to login...');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
