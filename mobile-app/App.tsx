import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native'
import React from 'react'
import WebFrontendScreen from './src/screens/WebFrontendScreen'
import { AuthProvider, useAuth } from './src/context/AuthContext'

function AppContent() {
  const { user } = useAuth()
  const route = user ? 'dashboard' : 'home'

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <WebFrontendScreen route={route} />
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
