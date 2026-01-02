import React from 'react'
import { View, Text, Button, StyleSheet, ScrollView, Alert, Platform, Animated } from 'react-native'
import HRLineChart from '../components/HRLineChart'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { readingsApi, wellnessApi, userApi } from '../services/api'
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

  const [isExporting, setIsExporting] = React.useState(false)

  const exportCSV = () => {
    Alert.alert(
      'Export Data',
      'Download a CSV file of all your health readings and sessions?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export CSV', 
          onPress: performExport 
        }
      ]
    )
  }

  const performExport = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const { accessToken } = await getTokens()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      if (Platform.OS === 'web') {
        Alert.alert('Export not supported', 'Please use the iOS/Android app to export.')
        setIsExporting(false)
        return
      }

      // Get API base URL (fallback to localhost if not set)
      const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'
      const url = `${apiBase}/readings/export/?format=csv`
      const fileName = `calmipet_readings_${Date.now()}.csv`
      const dir = (FileSystem as any).cacheDirectory || (FileSystem as any).documentDirectory || ''
      const fileUri = `${dir}${fileName}`

      const downloadRes = await FileSystem.downloadAsync(url, fileUri, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (downloadRes.status !== 200) {
        throw new Error('Failed to download export file')
      }

      await Sharing.shareAsync(downloadRes.uri, {
        mimeType: 'text/csv',
        UTI: 'public.comma-separated-values-text',
      })
      
      Alert.alert('Success', 'Data exported successfully!')
    } catch (e: any) {
      console.error(e)
      const msg = e?.message || 'Could not export readings'
      Alert.alert('Export failed', msg)
    } finally {
      setIsExporting(false)
    }
  }

  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data?',
      'This action is irreversible. All your readings, pet progress, and stats will be wiped forever. Your account will remain.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true)
            try {
              const { accessToken } = await getTokens()
              if (!accessToken) throw new Error('Not authenticated')
              
              await userApi.resetData(accessToken)
              Alert.alert('Success', 'All your data has been reset.')
              
              // Refresh local state
              setStreak(null)
              setPet(null)
            } catch (e: any) {
              const msg = e?.response?.data?.error || e?.message || 'Deletion failed'
              Alert.alert('Error', msg)
            } finally {
              setIsDeleting(false)
            }
          },
        },
      ]
    )
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
          <Button 
            title={isExporting ? "Exporting..." : "Export Data (CSV)"} 
            onPress={exportCSV} 
            disabled={isExporting}
          />
          <View style={{ height: 8 }} />
          <Button 
            title={isDeleting ? "Deleting..." : "Delete All Data"} 
            onPress={handleDeleteData} 
            color="#ff4444"
            disabled={isDeleting}
          />
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
