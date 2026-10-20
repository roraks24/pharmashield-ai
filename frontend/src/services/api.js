import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('PharmaShield API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
