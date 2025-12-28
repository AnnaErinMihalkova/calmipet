import React from 'react'
import { View, Text, Button, StyleSheet, ScrollView, Alert, Platform, Animated } from 'react-native'
import HRLineChart from '../components/HRLineChart'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { readingsApi, wellnessApi } from '../services/api'
import { getTokens } from '../services/storage'

type Props = { user: any; onLogout: () => void; onAddReading: () => void; onOpenBreathing: () => void }

export default function HomeScreen({ user, onLogout, onAddReading, onOpenBreathing }: Props) {
  const [streak, setStreak] = React.useState<any>(null)
  const [pet, setPet] = React.useState<any>(null)
  const scaleAnim = React.useRef(new Animated.Value(1)).current

  React.useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { accessToken } = await getTokens()
        if (!accessToken) return
        const s = await wellnessApi.streak(accessToken)
        const p = await wellnessApi.pet(accessToken)
        if (mounted) {
          setStreak(s)
          setPet(p)
        }
      } catch {}
    })()
    return () => { mounted = false }
  }, [])

  React.useEffect(() => {
    const loop = Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 4000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 2000, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1.0, duration: 4000, useNativeDriver: true }),
    ])
    const run = () => {
      loop.start(() => run())
    }
    run()
    return () => {
      scaleAnim.stopAnimation()
    }
  }, [scaleAnim])

  const exportCSV = async () => {
    try {
      const { accessToken } = await getTokens()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }
      const result = await readingsApi.list(accessToken, 1, 1000)
      const items = Array.isArray(result.items) ? result.items : []
      if (items.length === 0) {
        throw new Error('No readings to export')
      }

      const header = ['id', 'timestamp', 'hr_bpm', 'hrv_rmssd', 'user_id']
      const rows = items.map((r: any) => [
        r.id,
        r.createdAt,
        r.hr ?? '',
        r.hrv ?? '',
        r.userId ?? '',
      ])
      const csv = [header.join(','), ...rows.map((cols) => cols.map((v) => String(v)).join(','))].join('\n')

      if (Platform.OS === 'web') {
        Alert.alert('Export not supported', 'Please use the iOS app to export.')
        return
      }

      const fileName = `readings_${Date.now()}.csv`
      const file = new File(Paths.cache, fileName)
      file.create({ overwrite: true })
      file.write(csv, { encoding: 'utf8' })

      await Sharing.shareAsync(file.uri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
      })
    } catch (e: any) {
      const msg = e?.message || 'Could not export readings'
      Alert.alert('Export failed', msg)
    }
  }

  return (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <Text style={styles.welcome}>Welcome, {user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Animated.Text style={{ fontSize: 100, transform: [{ scale: scaleAnim }] }}>🦝</Animated.Text>
          <Text style={{ marginTop: 8 }}>{streak ? `Streak: ${streak.current_streak}d` : 'Loading...'}</Text>
          <Text style={{ marginTop: 4 }}>{pet ? `Mood: ${pet.mood}` : ''}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <Button title="Add Reading" onPress={onAddReading} />
          <View style={{ height: 8 }} />
          <Button title="Breathing Coach" onPress={onOpenBreathing} />
          <View style={{ height: 8 }} />
          <Button title="Export CSV" onPress={exportCSV} />
          <View style={{ height: 8 }} />
          <Button title="Log Out" onPress={onLogout} color="#999" />
        </View>
      </View>
      <HRLineChart limit={50} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  card: { width: '90%', maxWidth: 420, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  welcome: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  email: { fontSize: 14, color: '#666', marginBottom: 20 },
  buttonContainer: { marginTop: 8 },
})
