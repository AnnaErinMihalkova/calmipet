// frontend/src/services/api.ts — Fixed version 
// Changes (audit items #19, #20): 
//   - Single shared Axios instance with a consistent base URL (#19) 
//     (was two instances: '/api/' with trailing slash vs '/api' without) 
//   - Methods that have no backend implementation are clearly marked and 
//     will throw a descriptive error instead of silently returning 404 (#20) 
 
import axios, { AxiosInstance } from 'axios'; 
 
// --------------------------------------------------------------------------- 
// ONE shared instance — consistent base URL, no trailing-slash ambiguity (#19) 
// --------------------------------------------------------------------------- 
const API_BASE = process.env.REACT_APP_API_BASE ?? 'http://localhost:8000'; 
 
export const apiClient: AxiosInstance = axios.create({ 
  baseURL: `${API_BASE}/api`, 
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