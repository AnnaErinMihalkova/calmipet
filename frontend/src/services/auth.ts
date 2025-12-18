import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:4000/api');

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface User {
  id: number;
  username: string;
  email: string;
  date_joined?: string;
}

export interface SignUpData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

// Email validation function
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const authService = {
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    if (!validateEmail(data.email)) {
      throw new Error('Please enter a valid email address');
    }
    const response = await authApi.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    if (!validateEmail(data.email)) {
      throw new Error('Please enter a valid email address');
    }
    const response = await authApi.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const token = localStorage.getItem('accessToken') || '';
    const response = await authApi.get<User>('/auth/me', { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },

  logout: async (): Promise<void> => {
    const token = localStorage.getItem('accessToken') || '';
    try { await authApi.post('/auth/revoke', {}, { headers: { Authorization: `Bearer ${token}` } }); } catch {}
    try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } catch {}
  },

  updateAccount: async (data: Partial<User>): Promise<User> => {
    const token = localStorage.getItem('accessToken') || '';
    const response = await authApi.post<User>('/users/update', data, { headers: { Authorization: `Bearer ${token}` } });
    return response.data;
  },
  deleteAccount: async (): Promise<void> => {
    const token = localStorage.getItem('accessToken') || '';
    try { await authApi.post('/auth/revoke', {}, { headers: { Authorization: `Bearer ${token}` } }); } catch {}
    try { localStorage.clear(); } catch {}
  },
};

export default authService;

