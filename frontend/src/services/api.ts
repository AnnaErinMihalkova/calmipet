import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Reading {
  id?: number;
  user: number;
  ts: string;
  hr_bpm: number;
  hrv_rmssd: number;
}

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
  createReading: async (reading: Omit<Reading, 'id'>): Promise<Reading> => {
    const response = await api.post('readings/', reading);
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
};

export default api;