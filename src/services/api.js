import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('bio_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const ecgService = {
  upload: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ecg/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
  
  getAnalysis: async (sessionId) => {
    const response = await api.get(`/ecg/analyze/${sessionId}`);
    return response.data;
  },
};

export const localizationService = {
  solve: async (sessionId, modality = 'ecg', algorithm = 'pinn') => {
    const response = await api.post('/localization/solve', {
      session_id: sessionId,
      modality,
      algorithm,
    });
    return response.data;
  },
  
  getResiduals: async (sessionId) => {
    const response = await api.get(`/localization/residuals/${sessionId}`);
    return response.data;
  },
};

export const healthService = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api;
