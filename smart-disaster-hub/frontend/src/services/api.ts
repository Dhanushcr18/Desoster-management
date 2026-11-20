import axios from 'axios';
import type {
  User,
  Alert,
  Report,
  Warehouse,
  Shipment,
  RoadRisk,
  AgentDecision,
  ImpactMetrics,
  AgentStatusInfo,
  ReplayStatus,
  ReplayComparison,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
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
  },
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
  },
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
    contactName?: string;
    contactPhone?: string;
    contactLocation?: string;
  }) => {
    const response = await api.post('/api/reports', reportData);
    return response.data;
  },

  getUserReports: async () => {
    const response = await api.get('/api/reports/me');
    return response.data;
  },
};

// ─────────────────────────────────────────────────────────────
// Supply Resilience Platform APIs
// ─────────────────────────────────────────────────────────────
export const resilienceAPI = {
  // Warehouses
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await api.get('/api/warehouses');
    return response.data;
  },

  createWarehouse: async (data: Partial<Warehouse>): Promise<Warehouse> => {
    const response = await api.post('/api/warehouses', data);
    return response.data;
  },

  // Shipments
  getShipments: async (params?: { status?: string; cargoType?: string; priority?: string }): Promise<Shipment[]> => {
    const response = await api.get('/api/shipments', { params });
    return response.data;
  },

  getShipmentById: async (id: number | string): Promise<Shipment> => {
    const response = await api.get(`/api/shipments/${id}`);
    return response.data;
  },

  getShipmentByCode: async (code: string): Promise<Shipment> => {
    const response = await api.get(`/api/shipments/code/${code}`);
    return response.data;
  },

  createShipment: async (data: any): Promise<Shipment> => {
    const response = await api.post('/api/shipments', data);
    return response.data;
  },

  // Road Risks
  getRoadRisks: async (): Promise<RoadRisk[]> => {
    const response = await api.get('/api/risk/roads');
    return response.data;
  },

  assessAllRoads: async (): Promise<{ message: string; roads: RoadRisk[] }> => {
    const response = await api.post('/api/risk/assess');
    return response.data;
  },

  // Autonomous Agent
  triggerAgentRun: async (): Promise<{ message: string; summary: any; status: AgentStatusInfo }> => {
    const response = await api.post('/api/agent/run');
    return response.data;
  },

  getDecisions: async (limit: number = 50): Promise<AgentDecision[]> => {
    const response = await api.get('/api/agent/decisions', { params: { limit } });
    return response.data;
  },

  getAgentStatus: async (): Promise<AgentStatusInfo> => {
    const response = await api.get('/api/agent/status');
    return response.data;
  },

  // Impact
  getImpact: async (): Promise<ImpactMetrics> => {
    const response = await api.get('/api/impact');
    return response.data;
  },

  // Replay
  startReplay: async (scenario: string = 'kerala-2018', speed: number = 2): Promise<{ message: string; status: ReplayStatus }> => {
    const response = await api.post('/api/replay/start', { scenario, speed });
    return response.data;
  },

  pauseReplay: async (): Promise<{ message: string; status: ReplayStatus }> => {
    const response = await api.post('/api/replay/pause');
    return response.data;
  },

  stopReplay: async (): Promise<{ message: string; status: ReplayStatus }> => {
    const response = await api.post('/api/replay/stop');
    return response.data;
  },

  getReplayStatus: async (): Promise<ReplayStatus> => {
    const response = await api.get('/api/replay/status');
    return response.data;
  },

  getReplayComparison: async (scenario: string = 'kerala-2018'): Promise<ReplayComparison> => {
    const response = await api.get('/api/replay/comparison', { params: { scenario } });
    return response.data;
  },
};

export default api;
