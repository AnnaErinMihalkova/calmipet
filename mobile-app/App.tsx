import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform, LogBox } from 'react-native'
import React from 'react'
import * as Notifications from 'expo-notifications'
import { initNotifications, scheduleDailyReminders } from './src/services/notifications'
import WebFrontendScreen from './src/screens/WebFrontendScreen'
import { AuthProvider, useAuth } from './src/context/AuthContext'

LogBox.ignoreLogs([
  "Could not access feature flag 'disableEventLoopOnBridgeless'",
  "console.error: Could not access feature flag 'disableEventLoopOnBridgeless' because native module method was not available"
])

function AppContent() {
  const { user } = useAuth()
  const route = user ? 'dashboard' : 'home'

  React.useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    })
    ;(async () => {
      const ok = await initNotifications()
      if (ok) {
        await scheduleDailyReminders([9, 20])
      }
    })()
  }, [])

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
