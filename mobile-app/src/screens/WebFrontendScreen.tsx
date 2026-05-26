import * as React from 'react'
import { View, ActivityIndicator, StyleSheet, Text, Pressable } from 'react-native'
import { getWebUrl } from '../config'
import WebView from 'react-native-webview'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../context/AuthContext'

function buildWebUri(base: string, path: string): string {
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base
  if (!path || path === '/') return `${normalized}/`
  const segment = path.startsWith('/') ? path : `/${path}`
  return `${normalized}${segment}`
}

export default function WebFrontendScreen({ path = '/' }: { path?: string }) {
  const { syncFromWebView } = useAuth()
  const [loading, setLoading] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)
  const [reloadKey, setReloadKey] = React.useState(0)
  const uri = React.useMemo(() => buildWebUri(getWebUrl(), path), [path, reloadKey])
  const preInject = React.useMemo(() => {
    return `
      try {
        (function(){
          var css = [
            'html, body, #root { background: #0a0a0a !important; height: 100% !important; overflow: hidden !important; overscroll-behavior: none; touch-action: pan-y; }',
            '#root { display: flex; flex-direction: column; }',
            '.App { flex: 1; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }',
            '.login-container { overflow: auto !important; }',
            '.content { overflow: visible !important; }'
          ].join('\\n');
          var s = document.createElement('style'); s.innerHTML = css; document.head.appendChild(s);
          document.documentElement.style.backgroundColor = '#0a0a0a';
          document.body.style.backgroundColor = '#0a0a0a';
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
        const msg = JSON.parse(raw) as { type?: string; token?: string }
        if (msg.type === 'CALMIPET_AUTH' && msg.token) {
          await syncFromWebView(msg.token)
          await AsyncStorage.setItem('accessToken', msg.token)
          await refreshInjectedAuth()
        }
        if (msg.type === 'CALMIPET_LOGOUT') {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken'])
        }
      } catch {
        /* ignore malformed messages */
      }
    },
    [syncFromWebView, refreshInjectedAuth]
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
        <WebView
          key={reloadKey}
          source={{ uri }}
          injectedJavaScriptBeforeContentLoaded={preInject}
          injectedJavaScript={inject}
          onMessage={(e) => handleWebMessage(e.nativeEvent.data)}
          onLoadEnd={() => { setLoading(false); setLoadError(null) }}
          onHttpError={(e) => {
            setLoading(false)
            setLoadError(`HTTP ${e.nativeEvent.statusCode} for ${uri}`)
          }}
          onError={(e) => {
            setLoading(false)
            const msg = e.nativeEvent.description || 'Connection timed out'
            setLoadError(`${msg}\n\nURL: ${uri}`)
          }}
          startInLoadingState
          style={styles.webview}
          bounces={true}
          overScrollMode="always"
          nestedScrollEnabled
          showsVerticalScrollIndicator={true}
          showsHorizontalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
          mixedContentMode="always"
          originWhitelist={['http://*', 'https://*']}
        />
      )}
      {loading && !loadError && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  webview: { flex: 1, backgroundColor: '#0a0a0a' },
  loaderOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  errorBox: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: '#0a0a0a',
  },
  errorTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  errorText: { color: '#ccc', fontSize: 14, marginBottom: 16 },
  errorHint: { color: '#888', fontSize: 13, lineHeight: 20, marginBottom: 24 },
  retryBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#3498DB',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: { color: '#fff', fontWeight: '600' },
})
