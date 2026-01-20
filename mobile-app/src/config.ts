import { Platform } from 'react-native'
import Constants from 'expo-constants'
declare const process: any

const getHostFromExpo = () => {
  try {
    const host = (Constants as any).expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoClient?.hostUri
    if (host && typeof host === 'string') {
      const withoutPort = host.split(':')[0]
      if (withoutPort && withoutPort !== '127.0.0.1' && withoutPort !== 'localhost') {
        return withoutPort
      }
    }
  } catch {}
  return Platform.OS === 'web' ? '127.0.0.1' : '192.168.0.78'
}

export const getBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL
  if (envUrl) return envUrl
  const host = getHostFromExpo()
  return `http://${host}:8000/api`
}

export const API_URL = getBaseUrl()
export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL ||
  (Platform.OS === 'web' ? 'http://127.0.0.1:3001/' : `http://${getHostFromExpo()}:3001/`)
