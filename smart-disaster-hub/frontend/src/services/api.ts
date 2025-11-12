import axios from 'axios';
import type { User, Alert, Report } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string) => {
    const response = await api.post('/api/auth/register', { email, password, name });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  }
};

// Alerts API
export const alertsAPI = {
  getAll: async (params?: { severity?: string; bbox?: string }) => {
    const response = await api.get('/api/alerts', { params });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/api/alerts/${id}`);
    return response.data;
  },

  create: async (alertData: {
    title: string;
    description: string;
    geometry: { coordinates: [number, number] };
    severity: string;
    source: string;
    photos?: string[];
  }) => {
    const response = await api.post('/api/alerts', alertData);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/api/alerts/${id}`);
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  create: async (reportData: {
    alertId: string;
    status: 'safe' | 'help';
    note?: string;
    safeRadius?: number;
    locationDetails?: {
      address?: string;
      landmark?: string;
      affectedRoad?: string;
      alternateRoute?: string;
      extraDistance?: number;
      estimatedTime?: number;
      routeDescription?: string;
    };
  }) => {
    const response = await api.post('/api/reports', reportData);
    return response.data;
  },

  getUserReports: async () => {
    const response = await api.get('/api/reports/me');
    return response.data;
  }
};

export default api;
