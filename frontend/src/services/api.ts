import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/';

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
  ts?: string;
  hr_bpm: number;
  hrv_rmssd: number;
}

export type CreateReading = {
  hr_bpm: number;
  hrv_rmssd?: number;
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
    const response = await api.post('readings/', reading);
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
