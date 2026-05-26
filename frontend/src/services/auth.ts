import { apiClient } from './api'; 
import { clearCachedUser } from './bracelet-simulator';
 
export interface RegisterPayload { 
  email: string; 
  username: string; 
  password: string; 
  age?: number;
  gender?: string;
  baseline_hr?: number;
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
  age?: number;
  gender?: string;
  baseline_hr?: number;
} 

export interface ProfileUpdatePayload {
  username?: string;
  age?: number;
  gender?: string;
  baseline_hr?: number;
}
 
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/** Notify React views (and Expo WebView shell) that auth state changed. */
export function notifyAuthChanged(token?: string, userId?: number): void {
  try {
    window.dispatchEvent(new Event('calmipet-auth-changed'));
  } catch {
    /* SSR */
  }
  const bridge = (window as { ReactNativeWebView?: { postMessage: (msg: string) => void } })
    .ReactNativeWebView;
  if (bridge?.postMessage && token) {
    bridge.postMessage(
      JSON.stringify({ type: 'CALMIPET_AUTH', token, user_id: userId ?? null })
    );
  }
}

export const authService = { 
  register: async (payload: RegisterPayload): Promise<AuthResponse> => { 
    const { data } = await apiClient.post<AuthResponse>('auth/register/', payload); 
    localStorage.setItem('calmipet-token', data.token); 
    if (data.user_id != null) {
      localStorage.setItem('hb_user_id', String(data.user_id));
    }
    notifyAuthChanged(data.token, data.user_id);
    return data; 
  }, 
 
  login: async (payload: LoginPayload): Promise<AuthResponse> => { 
    const { data } = await apiClient.post<AuthResponse>('auth/login/', payload); 
    localStorage.setItem('calmipet-token', data.token); 
    if (data.user_id != null) {
      localStorage.setItem('hb_user_id', String(data.user_id));
    }
    notifyAuthChanged(data.token, data.user_id);
    return data; 
  }, 
 
  logout: (): void => { 
    localStorage.removeItem('calmipet-token'); 
    localStorage.removeItem('hb_user_id');
    clearCachedUser();
    notifyAuthChanged();
  }, 
 
  getMe: async (): Promise<UserProfile> => { 
    const { data } = await apiClient.get<UserProfile>('auth/me/'); 
    return data; 
  }, 
 
  isAuthenticated: (): boolean => { 
    return Boolean(localStorage.getItem('calmipet-token')); 
  }, 
 
  updatePet: async (petType: string): Promise<{ pet_type: string }> => { 
    const { data } = await apiClient.patch('users/pet/', null, { 
      params: { pet_type: petType }, 
    }); 
    return data; 
  }, 

  updateProfile: async (payload: ProfileUpdatePayload): Promise<{ status: string }> => {
    const { data } = await apiClient.patch('auth/profile/', payload);
    return data;
  },

  deleteAccount: async (): Promise<void> => {
    await apiClient.delete('auth/delete/');
  },
};