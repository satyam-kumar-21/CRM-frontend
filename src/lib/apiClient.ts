import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Sends HTTP-Only Auth Cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle automated refresh tokens or suspension errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    if (status === 403 && message?.includes('suspended')) {
      // Redirect to suspended alert or trigger toast
      if (typeof window !== 'undefined') {
        window.location.href = '/suspended';
      }
    }

    return Promise.reject(error);
  }
);