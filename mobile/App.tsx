import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AuthScreen from './src/screens/AuthScreen'
import HomeScreen from './src/screens/HomeScreen'
import AddReadingScreen from './src/screens/AddReadingScreen'
import BreathingCoachScreen from './src/screens/BreathingCoachScreen'
import { AuthProvider, useAuth } from './src/context/AuthContext'

function AppContent() {
  const { user, logout } = useAuth()
  const [showAddReading, setShowAddReading] = React.useState(false)
  const [showBreathing, setShowBreathing] = React.useState(false)

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CalmiPet Mobile</Text>
      {!user ? (
        <AuthScreen />
      ) : showBreathing ? (
        <BreathingCoachScreen onBack={() => setShowBreathing(false)} />
      ) : showAddReading ? (
        <AddReadingScreen onBack={() => setShowAddReading(false)} />
      ) : (
        <HomeScreen user={user} onLogout={logout} onAddReading={() => setShowAddReading(true)} onOpenBreathing={() => setShowBreathing(true)} />
      )}
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
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  card: { width: '90%', maxWidth: 420, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  message: { marginTop: 8, color: '#555' }
});
