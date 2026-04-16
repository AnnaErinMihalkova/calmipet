import axios, { AxiosInstance } from 'axios'; 
 
// --------------------------------------------------------------------------- 
// ONE shared instance — consistent base URL, no trailing-slash ambiguity (#19) 
// --------------------------------------------------------------------------- 
// Support both REACT_APP_API_BASE and REACT_APP_API_BASE_URL for backward compatibility
let API_BASE = process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE;

if (!API_BASE) {
  // If deployed to Render without env vars properly synced, fallback to the known backend URL
  if (window.location.hostname === 'calmipet.onrender.com' || window.location.hostname === 'calmipet-frontend.onrender.com') {
    API_BASE = 'https://calmipet-backend.onrender.com/api';
  } else {
    // Local development fallback
    API_BASE = `http://${window.location.hostname}:8000/api`;
  }
}

// If it doesn't end with /api, append it
if (!API_BASE.endsWith('/api') && !API_BASE.endsWith('/api/')) {
  API_BASE = `${API_BASE}/api`;
}

export const apiClient: AxiosInstance = axios.create({ 
  baseURL: API_BASE, 
  headers: { 'Content-Type': 'application/json' }, 
}); 
 
// Attach the auth token to every request automatically 
apiClient.interceptors.request.use((config) => { 
  const token = localStorage.getItem('calmipet-token'); 
  if (token) { 
    config.headers['Authorization'] = `Bearer ${token}`; 
  } 
  return config; 
}); 
 
// --------------------------------------------------------------------------- 
// Types 
// --------------------------------------------------------------------------- 
export interface Reading { 
  id: number; 
  heart_rate: number; 
  hrv: number; 
  stress_level: number; 
  timestamp: string; 
} 
 
export interface NewReading { 
  heart_rate: number; 
  hrv?: number; 
  stress_level?: number; 
} 
 
// --------------------------------------------------------------------------- 
// Reading service 
// --------------------------------------------------------------------------- 
export const readingService = { 
  getReadings: async (limit = 50): Promise<Reading[]> => { 
    const { data } = await apiClient.get<Reading[]>('/data', { 
      params: { limit }, 
    }); 
    return data; 
  }, 
 
  createReading: async (payload: NewReading): Promise<{ status: string }> => { 
    const { data } = await apiClient.post('/data', payload); 
    return data; 
  }, 
 
  // ------------------------------------------------------------------------- 
  // The following methods have NO matching backend endpoints yet. 
  // They are kept here as stubs so callers compile, but they throw at runtime 
  // with a clear message rather than silently returning a 404 (#20). 
  // Implement the corresponding backend routes before using these. 
  // ------------------------------------------------------------------------- 
 
  /** NOT IMPLEMENTED — backend has no GET /readings/:id endpoint */ 
  getReading: async (_id: number): Promise<Reading> => { 
    throw new Error('[readingService.getReading] Backend endpoint not implemented yet.'); 
  }, 
 
  /** NOT IMPLEMENTED — backend has no PUT /readings/:id endpoint */ 
  updateReading: async (_id: number, _payload: Partial<NewReading>): Promise<Reading> => { 
    throw new Error('[readingService.updateReading] Backend endpoint not implemented yet.'); 
  }, 
 
  /** NOT IMPLEMENTED — backend has no DELETE /readings/:id endpoint */ 
  deleteReading: async (_id: number): Promise<void> => { 
    throw new Error('[readingService.deleteReading] Backend endpoint not implemented yet.'); 
  }, 
 
  /** NOT IMPLEMENTED — backend has no GET /readings/export endpoint */ 
  exportCsv: async (): Promise<Blob> => { 
    throw new Error('[readingService.exportCsv] Backend endpoint not implemented yet.'); 
  }, 
}; 
 
// --------------------------------------------------------------------------- 
// Analysis service 
// --------------------------------------------------------------------------- 
export const analysisService = { 
  analyze: async (payload: NewReading) => { 
    const { data } = await apiClient.post('/analyze', payload); 
    return data; 
  }, 
}; 
 
// --------------------------------------------------------------------------- 
// Breathing session service 
// --------------------------------------------------------------------------- 
export const breathingService = { 
  startSession: async (): Promise<{ id: number }> => { 
    const { data } = await apiClient.post('/breathing/start'); 
    return data; 
  }, 
 
  completeSession: async (sessionId: number): Promise<{ id: number; completed: boolean }> => { 
    const { data } = await apiClient.post(`/breathing/${sessionId}/complete`); 
    return data; 
  }, 
 
  getStreak: async () => { 
    const { data } = await apiClient.get('/breathing/streak'); 
    return data; 
  }, 
};