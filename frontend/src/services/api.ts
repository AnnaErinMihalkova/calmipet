import axios from 'axios';
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || '/api/');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

export interface Reading {
  id?: number;
  timestamp?: string;
  heart_rate: number;
  stress_level?: number;
}

export type CreateReading = {
  heart_rate: number;
  stress_level?: number;
  grip_force?: number;
  posture_score?: number;
};

export type CreateExternalReading = {
  userId: string;
  hr: number;
  hrv?: number;
  timestamp?: string;
};

export const readingService = {
  // Get all readings
  getAllReadings: async (): Promise<Reading[]> => {
    const response = await api.get('readings/');
    return response.data;
  },

  // Get a specific reading
  getReading: async (id: number): Promise<Reading> => {
    const response = await api.get(`readings/${id}/`);
    return response.data;
  },

  // Create a new reading
  createReading: async (reading: CreateReading): Promise<Reading> => {
    const payload: any = {
      heart_rate: reading.heart_rate,
    };
    if (reading.stress_level !== undefined) payload.stress_level = reading.stress_level;
    const response = await api.post('readings/', payload);
    return response.data;
  },

  // Create a new reading via CSRF-exempt endpoint (bracelet simulator)
  createReadingExternal: async (reading: CreateExternalReading): Promise<Reading> => {
    const payload: any = {
      userId: reading.userId,
      hr: reading.hr,
    };
    if (reading.hrv !== undefined) payload.hrv = reading.hrv;
    if (reading.timestamp) payload.timestamp = reading.timestamp;
    const response = await api.post('bracelet/readings/', payload);
    return response.data;
  },

  // Update a reading
  updateReading: async (id: number, reading: Partial<Reading>): Promise<Reading> => {
    const response = await api.put(`readings/${id}/`, reading);
    return response.data;
  },

  // Delete a reading
  deleteReading: async (id: number): Promise<void> => {
    await api.delete(`readings/${id}/`);
  },

  // Export readings as CSV
  exportCsv: async (): Promise<Blob> => {
    const response = await api.get('readings/export/', { responseType: 'blob' });
    return response.data;
  },
  };

export const wellnessService = {
  createBreathingSession: async (): Promise<any> => {
    const response = await api.post('breathing-sessions/', {});
    return response.data;
  },
  completeBreathingSession: async (id: number): Promise<any> => {
    const response = await api.post(`breathing-sessions/${id}/complete/`, {});
    return response.data;
  },
  getPet: async (): Promise<any> => {
    const response = await api.get('pets/mine/');
    return response.data;
  },
  getStreak: async (): Promise<any> => {
    const response = await api.get('streaks/mine/');
    return response.data;
  },
};

export default api;

// Minimal FastAPI integration (independent of Django backend)
const FASTAPI_HOST = typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1';
const FASTAPI_BASE = `http://${FASTAPI_HOST}:8000`;
export const fastapiService = {
  sendData: async (payload: { heart_rate: number; spo2: number; stress_level?: number }): Promise<any> => {
    const res = await axios.post(`${FASTAPI_BASE}/data`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },
  analyze: async (payload: { heart_rate: number; spo2?: number }): Promise<{ score: number; label: string; baseline_hr: number }> => {
    const res = await axios.post(`${FASTAPI_BASE}/analyze`, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return res.data;
  },
  getData: async (): Promise<any[]> => {
    const res = await axios.get(`${FASTAPI_BASE}/data`);
    return res.data;
  },
};

const FASTAPI_MODE_KEY = 'backend_mode';
export const backendMode = {
  get: (): 'django' | 'fastapi' => {
    try {
      const v = localStorage.getItem(FASTAPI_MODE_KEY);
      return v === 'fastapi' ? 'fastapi' : 'django';
    } catch {
      return 'django';
    }
  },
  set: (mode: 'django' | 'fastapi') => {
    try {
      localStorage.setItem(FASTAPI_MODE_KEY, mode);
    } catch {}
  },
  isFastApi: (): boolean => {
    return backendMode.get() === 'fastapi';
  },
};
