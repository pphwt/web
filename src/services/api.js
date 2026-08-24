import axios from 'axios';
import { API_BASE } from '../utils/constants';

const API_BASE_URL = API_BASE;

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
  // Upload a standard ECG file (npy/csv/WFDB/DICOM) and get real measurements +
  // waveform + honest localization gating in one call.
  analyzeFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/ecg/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  supportedFormats: async () => {
    const response = await api.get('/ecg/formats');
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
