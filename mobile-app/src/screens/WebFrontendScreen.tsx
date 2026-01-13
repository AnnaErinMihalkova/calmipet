import * as React from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { WEB_URL } from '../config'
import WebView from 'react-native-webview'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function WebFrontendScreen({ route }: { route?: string }) {
  const [loading, setLoading] = React.useState(true)
  const uri = React.useMemo(() => {
    return route ? `${WEB_URL}${WEB_URL.endsWith('/') ? '' : '/'}#${route}` : WEB_URL
  }, [route])
  const [inject, setInject] = React.useState<string>('')
  React.useEffect(() => {
    const load = async () => {
      try {
        const info = await AsyncStorage.getItem('hb_user_info')
        const [[, access], [, refresh]] = await AsyncStorage.multiGet(['accessToken', 'refreshToken'])
        const js = `
          try {
            ${info ? `localStorage.setItem('hb_user_info', '${info.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}');` : ''}
            ${access ? `localStorage.setItem('accessToken', '${access}');` : ''}
            ${refresh ? `localStorage.setItem('refreshToken', '${refresh}');` : ''}
          } catch(e) {}
          true;
        `
        setInject(js)
      } catch {}
    }
    load()
  }, [])
  return (
    <View style={styles.container}>
      <WebView 
        source={{ uri }}
        injectedJavaScript={inject}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState
        style={styles.webview}
      />
      {loading && (
        <View style={styles.loaderOverlay}>
          <ActivityIndicator size="large" color="#3498DB" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  webview: { flex: 1 },
  loaderOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    alignItems: 'center', justifyContent: 'center' 
  },
})
