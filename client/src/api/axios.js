import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
    }

    // When backend container is down, recomposing, or under maintenance (502, 503, or connection drop)
    const isMaintenanceOrOffline =
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNREFUSED' ||
      error.message?.includes('Network Error');

    // Do not trigger global maintenance screen on health-check endpoints themselves
    const isHealthCheck = error.config?.url?.includes('/health');

    if (isMaintenanceOrOffline && !isHealthCheck) {
      window.dispatchEvent(new CustomEvent('app:maintenance', { detail: true }));
    }

    return Promise.reject(error);
  }
);

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  const filename = imagePath.split('\\').pop().split('/').pop();

  return `/uploads/${filename}`;
};

export default api;
