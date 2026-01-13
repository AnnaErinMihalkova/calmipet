import React from 'react'
import { View, Text, Button, StyleSheet, ActivityIndicator, ScrollView, Alert, TouchableOpacity } from 'react-native'
import { useAuth } from '../context/AuthContext'
import { readingsApi } from '../api/client'
import { getTokens } from '../services/storage'

type Reading = {
  id: string
  hr: number | null
  hrv: number | null
  createdAt: string
  userId: number
  user?: {
    id: number
    username: string
    email: string
  }
}

type Props = {
  readingId: string
  onBack: () => void
  reading?: Reading // Optional: can pass reading directly to avoid fetch
}

export default function ReadingDetailScreen({ readingId, onBack, reading: initialReading }: Props) {
  const { user: currentUser } = useAuth()
  const [reading, setReading] = React.useState<Reading | null>(initialReading || null)
  const [loading, setLoading] = React.useState(!initialReading)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (initialReading) return

    const fetchReading = async () => {
      setLoading(true)
      setError(null)
      try {
        const { accessToken } = await getTokens()
        if (!accessToken) {
          throw new Error('Not authenticated')
        }
        const data = await readingsApi.get(accessToken, readingId)
        setReading(data)
      } catch (e: any) {
        const errorMessage = e?.response?.data?.message || e?.message || 'Failed to load reading'
        setError(errorMessage)
        Alert.alert('Error', errorMessage)
      } finally {
        setLoading(false)
      }
    }

    fetchReading()
  }, [readingId, initialReading])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading reading...</Text>
        </View>
      </View>
    )
  }

  if (error || !reading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.errorText}>{error || 'Reading not found'}</Text>
          <Button title="Go Back" onPress={onBack} />
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.title}>Reading Details</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Rate (HR)</Text>
          <Text style={styles.value}>
            {reading.hr !== null && reading.hr !== undefined ? `${reading.hr} BPM` : 'Not available'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heart Rate Variability (HRV)</Text>
          <Text style={styles.value}>
            {reading.hrv !== null && reading.hrv !== undefined ? `${reading.hrv.toFixed(2)} ms` : 'Not available'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timestamp</Text>
          <Text style={styles.value}>{formatDate(reading.createdAt)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User</Text>
          {reading.user ? (
            <View style={styles.userInfo}>
              <Text style={styles.value}>{reading.user.username}</Text>
              <Text style={styles.userEmail}>{reading.user.email}</Text>
            </View>
          ) : (
            <Text style={styles.value}>
              {currentUser?.username || `User ID: ${reading.userId}`}
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reading ID</Text>
          <Text style={styles.idText}>{reading.id}</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
             <Text style={styles.primaryBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  card: {
    width: '90%',
    maxWidth: 420,
    padding: 24,
    borderRadius: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
    color: '#2C3E50',
  },
  section: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#95A5A6',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '600',
  },
  userInfo: {
    marginTop: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 4,
  },
  idText: {
    fontSize: 12,
    color: '#BDC3C7',
    fontFamily: 'monospace',
  },
  loadingText: {
    marginTop: 12,
    textAlign: 'center',
    color: '#95A5A6',
  },
  errorText: {
    fontSize: 16,
    color: '#E74C3C',
    textAlign: 'center',
    marginBottom: 16,
  },
  primaryBtn: {
    backgroundColor: '#3498DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
})

