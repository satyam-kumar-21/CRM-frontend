import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined' && !config.headers.Authorization) {
    const accessToken = window.localStorage.getItem('companyAccessToken');
    if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.localStorage.removeItem('companyAccessToken');
      if (!window.location.pathname.includes('/login')) {
        window.location.replace('/company-admin/login');
      }
    }
    if (error.response?.status === 403 && error.response?.data?.message?.includes('suspended')) {
      if (typeof window !== 'undefined') {
        window.location.href = '/suspended';
      }
    }
    return Promise.reject(error);
  }
);