import React from 'react'
import { View, Text, TextInput, Button, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { readingsApi } from '../services/api'
import { getTokens } from '../services/storage'

export default function AddReadingScreen({ onBack }: { onBack: () => void }) {
  const { user } = useAuth()
  const [hr, setHr] = React.useState('')
  const [hrv, setHrv] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [message, setMessage] = React.useState('')

  const submit = async () => {
    if (!hr || isNaN(Number(hr))) {
      Alert.alert('Error', 'Please enter a valid heart rate (HR)')
      return
    }

    const hrValue = Number(hr)
    if (hrValue < 30 || hrValue > 220) {
      Alert.alert('Error', 'Heart rate must be between 30 and 220 BPM')
      return
    }

    let hrvValue: number | null = null
    if (hrv && hrv.trim() !== '') {
      const parsedHrv = Number(hrv)
      if (isNaN(parsedHrv)) {
        Alert.alert('Error', 'Please enter a valid HRV value')
        return
      }
      if (parsedHrv < 10 || parsedHrv > 200) {
        Alert.alert('Error', 'HRV must be between 10 and 200')
        return
      }
      hrvValue = parsedHrv
    }

    setLoading(true)
    setMessage('')

    try {
      const { accessToken } = await getTokens()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      await readingsApi.create(accessToken, {
        hr: hrValue,
        hrv: hrvValue,
        ts: new Date().toISOString(),
      })

      setMessage('Reading added successfully!')
      setHr('')
      setHrv('')
      
      // Clear success message after 2 seconds
      setTimeout(() => {
        setMessage('')
        onBack()
      }, 2000)
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to add reading'
      setMessage(errorMessage)
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Add Reading</Text>
      <Text style={styles.subtitle}>Enter your heart rate and HRV measurements</Text>

      <Text style={styles.label}>Heart Rate (HR) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 72"
        value={hr}
        onChangeText={setHr}
        keyboardType="numeric"
        editable={!loading}
      />
      <Text style={styles.hint}>BPM (30-220)</Text>

      <Text style={styles.label}>Heart Rate Variability (HRV)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g., 45.5 (optional)"
        value={hrv}
        onChangeText={setHrv}
        keyboardType="numeric"
        editable={!loading}
      />
      <Text style={styles.hint}>Optional (10-200)</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <View style={styles.buttonRow}>
          <Button title="Cancel" onPress={onBack} color="#999" />
          <View style={{ width: 8 }} />
          <Button title="Submit" onPress={submit} />
        </View>
      )}

      {!!message && (
        <Text style={[styles.message, message.includes('success') ? styles.successMessage : styles.errorMessage]}>
          {message}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '90%',
    maxWidth: 420,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
    fontSize: 16,
  },
  hint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  loader: {
    marginTop: 20,
  },
  message: {
    marginTop: 12,
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
  },
  successMessage: {
    color: '#155724',
    backgroundColor: '#d4edda',
  },
  errorMessage: {
    color: '#721c24',
    backgroundColor: '#f8d7da',
  },
})

