import React, { useState, useEffect, useCallback } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { readingsApi, wellnessApi } from '../api/client'
import HRLineChart from '../components/HRLineChart'

const animalEmojis: Record<string, string> = {
  raccoon: '🦝',
  cat: '🐱',
  dog: '🐶',
  rabbit: '🐰',
  fox: '🦊',
  panda: '🐼',
  koala: '🐨'
}

export default function HomeScreen({ 
  user, 
  onLogout, 
  onAddReading, 
  onOpenBreathing 
}: { 
  user: any; 
  onLogout: () => void; 
  onAddReading: () => void;
  onOpenBreathing: () => void;
}) {
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [streak, setStreak] = useState<any>(null)
  const [petEmoji, setPetEmoji] = useState('🦝')
  
  // Static pet display (no animation)

  const loadPetChoice = async () => {
    try {
      const stored = await AsyncStorage.getItem('hb_user_info')
      if (stored) {
        const info = JSON.parse(stored)
        if (info.petAnimal && animalEmojis[info.petAnimal]) {
          setPetEmoji(animalEmojis[info.petAnimal])
        }
      }
    } catch {}
  }

  useEffect(() => {
    loadPetChoice()
  }, [])

  const fetchData = useCallback(async () => {
    try {
      if (!user?.token) return
      
      const [readingsRes, streakRes] = await Promise.all([
        readingsApi.list(user.token),
        wellnessApi.streak(user.token).catch(() => null)
      ])
      
      setReadings(readingsRes.items || [])
      setStreak(streakRes)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [user?.token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const onRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  // Calculate Metrics
  const lastReading = readings[readings.length - 1]
  const heartRate = lastReading?.hr ?? '--'
  const hrv = lastReading?.hrv ?? null
  const stressLabel = hrv == null ? 'Unknown' : hrv < 30 ? 'High' : hrv < 50 ? 'Medium' : 'Low'
  const coherenceLabel = hrv == null ? 'Unknown' : hrv >= 60 ? 'High' : hrv >= 40 ? 'Medium' : 'Low'

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3498DB" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.appName}>MindRaccoon</Text>
            <Text style={styles.greeting}>Hello{user?.username ? `, ${user.username}` : ''}</Text>
            <Text style={styles.status}>Your biofeedback is {readings.length ? 'active' : 'waiting'}</Text>
          </View>
          <View style={styles.avatarPlaceholder}>
             <Text style={styles.avatarEmoji}>🦝</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={onOpenBreathing}>
            <Text style={styles.primaryBtnText}>Start Breathing</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onAddReading}>
            <Text style={styles.secondaryBtnText}>Log Mood</Text>
          </TouchableOpacity>
        </View>

        {/* Pet Visualization Card */}
        <View style={styles.petCard}>
           <View style={styles.petHeader}>
             <Text style={styles.petTitle}>My Companion</Text>
             <Text style={styles.petSubtitle}>{streak?.current_streak > 0 ? `${streak.current_streak} Day Streak!` : 'Start a streak!'}</Text>
           </View>
           <View style={styles.petContainer}>
              <Text style={styles.petEmoji}>
                {petEmoji}
              </Text>
              <View style={styles.petStatusContainer}>
                <Text style={styles.petStatusTitle}>Calm & Happy</Text>
                <Text style={styles.petStatusDesc}>Your biofeedback is keeping your companion healthy.</Text>
              </View>
           </View>
        </View>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Heart Rate */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Heart Rate</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{heartRate}</Text>
              <Text style={styles.metricUnit}>BPM</Text>
            </View>
          </View>

          {/* Stress */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Stress</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValueText}>{stressLabel}</Text>
            </View>
            <View style={styles.progressBarBg}>
               <View style={[
                 styles.progressBarFill, 
                 { 
                   width: hrv == null ? '0%' : hrv < 30 ? '80%' : hrv < 50 ? '50%' : '20%',
                   backgroundColor: hrv < 30 ? '#E74C3C' : hrv < 50 ? '#F39C12' : '#2ECC71'
                 }
               ]} />
            </View>
          </View>

          {/* Coherence */}
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Coherence</Text>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValueText}>{coherenceLabel}</Text>
            </View>
          </View>
        </View>

        {/* Chart Section */}
        {readings.length > 0 && (
          <View style={styles.chartSection}>
            <Text style={styles.sectionTitle}>Heart Rate Trend</Text>
            <HRLineChart limit={10} />
          </View>
        )}

        {/* Recent Readings List (Mini) */}
        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Recent Readings</Text>
           <TouchableOpacity onPress={onRefresh}>
             <Text style={styles.seeAll}>Refresh</Text>
           </TouchableOpacity>
        </View>

        {readings.slice().reverse().slice(0, 5).map((r: any, i: number) => (
          <View key={i} style={styles.readingRow}>
            <View>
              <Text style={styles.readingDate}>{new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
            <View style={{alignItems: 'flex-end'}}>
              <Text style={styles.readingValue}>{r.hr} BPM</Text>
              <Text style={styles.readingSubValue}>HRV: {r.hrv ?? '--'}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{height: 40}} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 24,
  },
  appName: {
    fontSize: 14,
    color: '#95A5A6',
    fontWeight: '600',
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECF0F1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#3498DB',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  secondaryBtnText: {
    color: '#34495E',
    fontWeight: '600',
    fontSize: 16,
  },
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  petHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  petTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  petSubtitle: {
    fontSize: 12,
    color: '#27AE60',
    fontWeight: '600',
    backgroundColor: '#EAFAF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  petContainer: {
    alignItems: 'center',
    padding: 20,
  },
  petStatusContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  petStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  petStatusDesc: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  petEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  metricLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 8,
    fontWeight: '600',
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#2C3E50',
  },
  metricValueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  metricUnit: {
    fontSize: 12,
    color: '#95A5A6',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#ECF0F1',
    borderRadius: 3,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
  },
  seeAll: {
    color: '#3498DB',
    fontWeight: '600',
  },
  readingRow: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F3F4',
  },
  readingDate: {
    color: '#2C3E50',
    fontWeight: '600',
    fontSize: 14,
  },
  readingValue: {
    color: '#2C3E50',
    fontWeight: '700',
    fontSize: 16,
  },
  readingSubValue: {
    color: '#95A5A6',
    fontSize: 12,
  },
  logoutBtn: {
    marginTop: 24,
    alignSelf: 'center',
    padding: 12,
  },
  logoutText: {
    color: '#E74C3C',
    fontWeight: '600',
  },
})
