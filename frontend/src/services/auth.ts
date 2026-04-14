import { apiClient } from './api'; 
import { clearCachedUser } from './bracelet-simulator';
 
export interface RegisterPayload { 
  email: string; 
  username: string; 
  password: string; 
} 
 
export interface LoginPayload { 
  email: string; 
  password: string; 
} 
 
export interface AuthResponse { 
  token: string; 
  user_id: number; 
} 
 
export interface UserProfile { 
  id: number; 
  email: string; 
  username: string; 
  is_admin: boolean; 
  pet_type: string; 
} 
 
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const authService = { 
  register: async (payload: RegisterPayload): Promise<AuthResponse> => { 
    const { data } = await apiClient.post<AuthResponse>('/auth/register/', payload); 
    localStorage.setItem('calmipet-token', data.token); 
    return data; 
  }, 
 
  login: async (payload: LoginPayload): Promise<AuthResponse> => { 
    const { data } = await apiClient.post<AuthResponse>('/auth/login/', payload); 
    localStorage.setItem('calmipet-token', data.token); 
    return data; 
  }, 
 
  logout: (): void => { 
    localStorage.removeItem('calmipet-token'); 
    clearCachedUser();
  }, 
 
  getMe: async (): Promise<UserProfile> => { 
    const { data } = await apiClient.get<UserProfile>('/auth/me/'); 
    return data; 
  }, 
 
  isAuthenticated: (): boolean => { 
    return Boolean(localStorage.getItem('calmipet-token')); 
  }, 
 
  updatePet: async (petType: string): Promise<{ pet_type: string }> => { 
    const { data } = await apiClient.patch('/users/pet/', null, { 
      params: { pet_type: petType }, 
    }); 
    return data; 
  }, 

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('/auth/delete/');
  },
};