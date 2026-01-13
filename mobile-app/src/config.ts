import { Platform } from 'react-native';
declare const process: any;

export const getBaseUrl = () => {
  // Default to /api to match legacy Django backend structure
  let baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api';
  if (Platform.OS !== 'web' && baseURL.includes('127.0.0.1')) {
    baseURL = 'http://10.250.88.163:8000/api';
  }
  return baseURL;
};

export const API_URL = getBaseUrl();
export const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL 
  || (Platform.OS === 'web' 
    ? 'http://127.0.0.1:3001/'
    : 'http://10.250.88.163:3001/');
