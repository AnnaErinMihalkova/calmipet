import axios from 'axios';

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:8000/api');

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 10000, // 10 second timeout
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
    const response = await authApi.post<AuthResponse>('/auth/signup/', data);
    return response.data;
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    if (!validateEmail(data.email)) {
      throw new Error('Please enter a valid email address');
    }
    const response = await authApi.post<AuthResponse>('/auth/login/', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const token = localStorage.getItem('accessToken') || '';
    // Django session based auth usually, but if token based, header is needed.
    // The backend views use SessionAuthentication or maybe TokenAuthentication?
    // Let's assume the backend handles auth via session cookie or we need to check how it expects auth.
    // The current backend code uses django.contrib.auth.login which sets a session cookie.
    // So axios needs withCredentials: true.
    const response = await authApi.get<User>('/auth/me/'); 
    return response.data;
  },

  logout: async (): Promise<void> => {
    try { await authApi.post('/auth/logout/'); } catch {}
    try { localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken'); } catch {}
  },

  updateAccount: async (data: Partial<User>): Promise<User> => {
    const response = await authApi.post<User>('/auth/update/', data);
    return response.data;
  },
  deleteAccount: async (): Promise<void> => {
    try { await authApi.delete('/auth/delete/'); } catch {}
    try { localStorage.clear(); } catch {}
  },
};

export default authService;

