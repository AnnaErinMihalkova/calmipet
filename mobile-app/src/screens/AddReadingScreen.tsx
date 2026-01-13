import React from 'react'
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { readingsApi } from '../api/client'
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
    <View style={styles.container}>
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
          <ActivityIndicator size="large" color="#3498DB" style={styles.loader} />
        ) : (
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onBack}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={submit}>
              <Text style={styles.submitBtnText}>Submit</Text>
            </TouchableOpacity>
          </View>
        )}

        {!!message && (
          <Text style={[styles.message, message.includes('success') ? styles.successMessage : styles.errorMessage]}>
            {message}
          </Text>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 24,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    color: '#2C3E50',
  },
  hint: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BDC3C7',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#7F8C8D',
    fontWeight: '600',
    fontSize: 16,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#3498DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
  },
  message: {
    marginTop: 20,
    padding: 12,
    borderRadius: 12,
    textAlign: 'center',
    overflow: 'hidden',
  },
  successMessage: {
    color: '#27AE60',
    backgroundColor: '#EAFAF1',
  },
  errorMessage: {
    color: '#C0392B',
    backgroundColor: '#FADBD8',
  },
})

