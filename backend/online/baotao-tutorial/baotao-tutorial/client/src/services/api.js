import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export const getCapsules = async (page = 1, limit = 20) => {
  const response = await api.get(`/api/capsules?page=${page}&limit=${limit}`);
  return response.data;
};

export const createCapsule = async (data) => {
  const response = await api.post('/api/capsules', data);
  return response.data;
};

export default api;
