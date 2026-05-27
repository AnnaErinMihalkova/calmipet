import * as React from 'react'
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from 'react-native'
import * as Linking from 'expo-linking'
import { getWebUrl } from '../config'
import WebView from 'react-native-webview'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../context/AuthContext'
import {
  buildBleWebInject,
  connectNativeBle,
  disconnectNativeBle,
} from '../services/nativeBle'

function buildWebUri(base: string, path: string): string {
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base
  if (!path || path === '/') return `${normalized}/`
  const segment = path.startsWith('/') ? path : `/${path}`
  return `${normalized}${segment}`
}

type WebMessage =
  | { type: 'CALMIPET_AUTH'; token?: string }
  | { type: 'CALMIPET_LOGOUT' }
  | { type: 'BLE_CONNECT' }
  | { type: 'BLE_DISCONNECT' }
  | { type: 'OPEN_BLUETOOTH_SETTINGS' }

export default function WebFrontendScreen({ path = '/' }: { path?: string }) {
  const { syncFromWebView } = useAuth()
  const webRef = React.useRef<WebView>(null)
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const uri = React.useMemo(() => buildWebUri(getWebUrl(), path), [path, reloadKey])

  const emitBleToWeb = React.useCallback((detail: Record<string, unknown>) => {
    webRef.current?.injectJavaScript(buildBleWebInject(detail))
  }, [])
  const preInject = React.useMemo(() => {
    return `
      try {
        (function(){
          var css = [
            'html, body { background-color: #150a24 !important; width: 100% !important; height: 100% !important; min-height: 100% !important; margin: 0 !important; overflow-x: hidden !important; }',
            'body { overflow-y: auto !important; -webkit-overflow-scrolling: touch; background-image: radial-gradient(120% 120% at 10% 20%, rgba(124, 58, 237, 0.22), transparent), radial-gradient(120% 120% at 90% 10%, rgba(167, 139, 250, 0.16), transparent) !important; }',
            '#root { display: flex !important; flex-direction: column !important; min-height: 100% !important; width: 100% !important; background: #150a24 !important; }',
            '.App { flex: 1 !important; overflow-y: visible !important; background: transparent !important; }',
            '.login-container { overflow: auto !important; }',
            '.content { overflow: visible !important; }',
            '.fullscreen-overlay { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; width: 100% !important; height: 100% !important; min-height: 100% !important; min-height: 100dvh !important; z-index: 9999 !important; }',
            'html.fullscreen-overlay-open, html.fullscreen-overlay-open body { overflow: hidden !important; height: 100% !important; }',
            'html.fullscreen-overlay-open .app-bottom-nav { display: none !important; }'
          ].join('\\n');
          var s = document.createElement('style'); s.innerHTML = css; document.head.appendChild(s);
          document.documentElement.style.backgroundColor = '#150a24';
          document.body.style.backgroundColor = '#150a24';
          window.__CALMIPET_NATIVE_BLE__ = true;
        })();
      } catch(e) {}
      true;
    `
  }, [])
  const buildInjectScript = React.useCallback(
    (access: string | null, refresh: string | null, info: string | null) => {
      const escape = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
      return `
        try {
          ${info ? `localStorage.setItem('hb_user_info', '${escape(info)}');` : ''}
          ${access ? `localStorage.setItem('calmipet-token', '${escape(access)}');` : ''}
          ${access ? `localStorage.setItem('accessToken', '${escape(access)}');` : ''}
          ${refresh ? `localStorage.setItem('refreshToken', '${escape(refresh)}');` : ''}
          window.dispatchEvent(new Event('calmipet-auth-changed'));
        } catch(e) {}
        true;
      `
    },
    []
  )

  const [inject, setInject] = React.useState<string>('')
  const refreshInjectedAuth = React.useCallback(async () => {
    try {
      const info = await AsyncStorage.getItem('hb_user_info')
      const [[, access], [, refresh]] = await AsyncStorage.multiGet(['accessToken', 'refreshToken'])
      setInject(buildInjectScript(access, refresh, info))
    } catch {
      setInject('true;')
    }
  }, [buildInjectScript])

  React.useEffect(() => {
    refreshInjectedAuth()
  }, [refreshInjectedAuth, path])

  const handleWebMessage = React.useCallback(
    async (raw: string) => {
      try {
        const msg = JSON.parse(raw) as WebMessage
        if (msg.type === 'CALMIPET_AUTH' && msg.token) {
          await syncFromWebView(msg.token)
          await AsyncStorage.setItem('accessToken', msg.token)
          await refreshInjectedAuth()
        }
        if (msg.type === 'CALMIPET_LOGOUT') {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
        }
        if (msg.type === 'OPEN_BLUETOOTH_SETTINGS') {
          await Linking.openSettings()
        }
        if (msg.type === 'BLE_CONNECT') {
          try {
            await connectNativeBle(
              (reading) => emitBleToWeb({ type: 'reading', reading }),
              (connected) => emitBleToWeb({ type: 'status', connected })
            )
          } catch (e) {
            const message = e instanceof Error ? e.message : 'Bluetooth connection failed'
            emitBleToWeb({ type: 'error', message })
            emitBleToWeb({ type: 'status', connected: false })
          }
        }
        if (msg.type === 'BLE_DISCONNECT') {
          await disconnectNativeBle((connected) => emitBleToWeb({ type: 'status', connected }))
        }
      } catch {
        /* ignore malformed messages */
      }
    },
    [syncFromWebView, refreshInjectedAuth, emitBleToWeb]
  )
  return (
    <View style={styles.container}>
      {loadError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Cannot reach the web app</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <Text style={styles.errorHint}>
            On your PC, start the frontend: cd frontend → npm start{'\n'}
            Phone and PC must be on the same Wi‑Fi.
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => { setLoadError(null); setLoading(true); setReloadKey((k) => k + 1) }}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <WebView
            ref={webRef}
            key={reloadKey}
            source={{ uri }}
            injectedJavaScriptBeforeContentLoaded={preInject}
            injectedJavaScript={inject}
            onMessage={(e: any) => handleWebMessage(e.nativeEvent.data)}
            onLoadEnd={() => { setLoading(false); setLoadError(null) }}
            onHttpError={(e: any) => {
              setLoading(false)
              setLoadError(`HTTP ${e.nativeEvent.statusCode} for ${uri}`)
            }}
            onError={(e: any) => {
              setLoading(false)
              const msg = e.nativeEvent.description || 'Connection timed out'
              setLoadError(`${msg}\n\nURL: ${uri}`)
            }}
            startInLoadingState
            style={styles.webview}
            cacheEnabled={false}
            incognito={true}
            bounces={true}
            overScrollMode="always"
            nestedScrollEnabled
            showsVerticalScrollIndicator={true}
            showsHorizontalScrollIndicator={false}
            contentInsetAdjustmentBehavior="automatic"
            mixedContentMode="always"
            originWhitelist={['http://*', 'https://*']}
          />
          <Pressable 
            style={styles.reloadFab} 
            onPress={() => {
              setLoading(true);
              setReloadKey(k => k + 1);
            }}
          >
            <Text style={{ color: '#fff', fontSize: 20 }}>↻</Text>
          </Pressable>
        </>
      )}
      {loading && !loadError && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#7c3aed" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#150a24' },
  webview: { flex: 1, backgroundColor: '#150a24' },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  reloadFab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  errorBox: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#150a24',
  },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  errorText: { color: '#ccc', fontSize: 14, marginBottom: 16 },
  errorHint: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 24 },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
})
