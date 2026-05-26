import { StatusBar } from 'expo-status-bar'
import { StyleSheet, View } from 'react-native'
import React from 'react'
import WebFrontendScreen from './src/screens/WebFrontendScreen'
import { AuthProvider, useAuth } from './src/context/AuthContext'

function AppContent() {
  const { user } = useAuth()
  const webPath = user ? '/dashboard' : '/'

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <WebFrontendScreen path={webPath} />
      </View>
      <StatusBar style="auto" />
    </View>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  content: {
    flex: 1,
  },
})
