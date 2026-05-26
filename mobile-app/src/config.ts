import { Platform } from 'react-native'
import Constants from 'expo-constants'

declare const __DEV__: boolean | undefined

function isPrivateLanHost(host: string): boolean {
  return /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)\d+\.\d+$/.test(host)
}

function isReachableDevHost(host: string): boolean {
  if (!host || host === '127.0.0.1' || host === 'localhost') return false
  // Tunnel hostnames cannot serve the local CRA dev server on :3001
  if (host.includes('exp.direct') || host.endsWith('.exp.host')) return false
  return isPrivateLanHost(host)
}

function hostFromUrl(url: string | undefined): string | null {
  if (!url) return null
  try {
    const host = new URL(url).hostname
    return isReachableDevHost(host) ? host : null
  } catch {
    return null
  }
}

/** LAN IP of the machine running Metro — same host the phone uses for the bundle. */
export function getDevServerHost(): string | null {
  const candidates: (string | undefined)[] = [
    Constants.expoConfig?.hostUri,
    (Constants as { manifest2?: { extra?: { expoClient?: { hostUri?: string } } } })
      .manifest2?.extra?.expoClient?.hostUri,
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost,
    (Constants as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost,
  ]

  for (const raw of candidates) {
    if (!raw || typeof raw !== 'string') continue
    const cleaned = raw.replace(/^exp:\/\//, '').split('/')[0]
    const host = cleaned.split(':')[0]?.trim()
    if (host && isReachableDevHost(host)) {
      return host
    }
  }

  return (
    hostFromUrl(process.env.EXPO_PUBLIC_API_BASE_URL) ||
    hostFromUrl(process.env.EXPO_PUBLIC_WEB_URL)
  )
}

function normalizeApiBase(url: string): string {
  const trimmed = url.replace(/\/+$/, '')
  return trimmed.endsWith('/api') ? `${trimmed}/` : `${trimmed}/api/`
}

export const getBaseUrl = (): string => {
  const devHost = getDevServerHost()
  if (devHost) {
    return normalizeApiBase(`http://${devHost}:8000`)
  }

  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL
  if (envUrl) {
    return normalizeApiBase(envUrl)
  }

  if (Platform.OS === 'web') {
    return normalizeApiBase('http://127.0.0.1:8000')
  }

  return normalizeApiBase('http://127.0.0.1:8000')
}

export const getWebUrl = (): string => {
  const devHost = getDevServerHost()
  if (devHost) {
    return `http://${devHost}:3001/`
  }

  const envUrl = process.env.EXPO_PUBLIC_WEB_URL
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl : `${envUrl}/`
  }

  if (Platform.OS === 'web') {
    return 'http://127.0.0.1:3001/'
  }

  return 'http://127.0.0.1:3001/'
}
