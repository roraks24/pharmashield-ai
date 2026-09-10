import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

// Optionally add interceptors here for auth tokens, etc.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

export default api;
