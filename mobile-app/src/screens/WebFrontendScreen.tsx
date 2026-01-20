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
            (function(){
              var css = 'html, body, #root { background: #0a0a0a !important; height: 100% !important; overflow: hidden !important; overscroll-behavior: none; touch-action: pan-y; } #root { display: flex; flex-direction: column; } .App { flex: 1; overflow-y: auto !important; -webkit-overflow-scrolling: touch; }';
              var s = document.createElement('style'); s.innerHTML = css; document.head.appendChild(s);
              document.documentElement.style.backgroundColor = '#0a0a0a';
              document.body.style.backgroundColor = '#0a0a0a';
            })();
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
        injectedJavaScriptBeforeContentLoaded={preInject}
        injectedJavaScript={inject}
        onLoadEnd={() => setLoading(false)}
        startInLoadingState
        style={styles.webview}
        bounces={true}
        overScrollMode="always"
        nestedScrollEnabled
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  webview: { flex: 1, backgroundColor: '#0a0a0a' },
  loaderOverlay: { 
    position: 'absolute', 
    top: 0, left: 0, right: 0, bottom: 0, 
    alignItems: 'center', justifyContent: 'center' 
  },
})
