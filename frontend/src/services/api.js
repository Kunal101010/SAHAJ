import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// 1. Create a central Axios instance for all API calls
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. Add "Interceptor" to automatically attach the Token to every request
// This ensures the backend knows who is making the request (logged-in user)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


export default api;