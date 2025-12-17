import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/auth/';

const authApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session-based auth
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
  message: string;
}

// Email validation function
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const authService = {
  // Sign up a new user
  signUp: async (data: SignUpData): Promise<AuthResponse> => {
    if (!validateEmail(data.email)) {
      throw new Error('Please enter a valid email address');
    }
    const response = await authApi.post<AuthResponse>('signup/', data);
    return response.data;
  },

  // Log in a user
  login: async (data: LoginData): Promise<AuthResponse> => {
    if (!validateEmail(data.email)) {
      throw new Error('Please enter a valid email address');
    }
    const response = await authApi.post<AuthResponse>('login/', data);
    return response.data;
  },

  me: async (): Promise<User> => {
    const response = await authApi.get<User>('me/');
    return response.data;
  },

  // Log out (if needed in the future)
  logout: async (): Promise<void> => {
    await authApi.post('logout/', {});
  },

  deleteAccount: async (): Promise<void> => {
    await authApi.delete('delete/');
  },
};

export default authService;

