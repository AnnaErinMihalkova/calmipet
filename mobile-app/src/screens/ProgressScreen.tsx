import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, View, ScrollView } from 'react-native'
import { wellnessApi } from '../api/client'
import { useAuth } from '../context/AuthContext'

export default function ProgressScreen() {
  const { user } = useAuth()
  const [streak, setStreak] = useState<any>(null)

  useEffect(() => {
    if (user?.token) {
      wellnessApi.streak(user.token).then(setStreak).catch(() => setStreak(null))
    }
  }, [user])

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Progress</Text>

      {/* Streak Card */}
      <View style={styles.streakCard}>
        <Text style={styles.streakTitle}>Current Streak</Text>
        <Text style={styles.streakValue}>{streak ? `${streak.current_streak} Days` : 'Loading...'}</Text>
        <Text style={styles.streakSub}>Keep it up!</Text>
      </View>

      {/* Evolution Progress */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Evolution Progress</Text>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '75%' }]} />
        </View>
        <Text style={styles.cardDesc}>Perform more sessions to evolve your companion.</Text>
      </View>

      {/* Daily Rituals */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily Rituals</Text>
        <View style={styles.ritualItem}>
          <Text style={styles.check}>✓</Text>
          <Text style={styles.ritualText}>Morning biofeedback</Text>
        </View>
        <View style={styles.ritualItem}>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.ritualText}>Evening reflection</Text>
        </View>
      </View>

      {/* Milestones */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Milestones</Text>
        <Text style={styles.cardDesc}>🏆 Early Riser, Zen Master unlocked</Text>
      </View>
      
      <View style={{height: 80}} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 24,
  },
  streakCard: {
    backgroundColor: '#2C3E50',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
  },
  streakTitle: {
    color: '#BDC3C7',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  streakValue: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 4,
  },
  streakSub: {
    color: '#3498DB',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  cardDesc: {
    color: '#7F8C8D',
    fontSize: 14,
    lineHeight: 20,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#ECF0F1',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3498DB',
    borderRadius: 5,
  },
  ritualItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  check: {
    color: '#2ECC71',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 20,
  },
  dot: {
    color: '#BDC3C7',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 10,
    width: 20,
  },
  ritualText: {
    color: '#34495E',
    fontSize: 15,
  },
})
