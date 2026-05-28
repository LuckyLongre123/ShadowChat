import axios from 'axios';

const rawBackendURI =
  process.env.NEXT_PUBLIC_BACKEND_URI || 'http://localhost:5000';
const cleanBackendURI = rawBackendURI
  .replace(/^"(.*)"$/, '$1')
  .replace(/\/$/, '');

export const api = axios.create({
  baseURL: `${cleanBackendURI}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      response.headers.Authorization = `Bearer ${token}`;
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized! Redirecting to login...');
      // 2. Client-side safe redirect (Bypass Next.js router crash)
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);
