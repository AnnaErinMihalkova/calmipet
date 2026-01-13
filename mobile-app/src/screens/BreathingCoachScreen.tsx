import React from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'

export default function BreathingCoachScreen({ onBack }: { onBack: () => void }) {
  const [secondsLeft, setSecondsLeft] = React.useState(60)
  const [running, setRunning] = React.useState(false)
  const scale = React.useRef(new Animated.Value(1)).current

  const progress = 60 - secondsLeft
  const cycle = progress % 10
  const phase = cycle < 4 ? 'Inhale…' : cycle < 6 ? 'Hold…' : 'Exhale…'
  const targetScale = cycle < 4 ? 1 + cycle * 0.06 : cycle < 6 ? 1.24 : 1.24 - (cycle - 6) * 0.06

  React.useEffect(() => {
    if (!running) return
    const interval = setInterval(() => setSecondsLeft((s: number) => s - 1), 1000)
    return () => clearInterval(interval)
  }, [running])

  React.useEffect(() => {
    Animated.timing(scale, { toValue: running ? targetScale : 1, duration: 900, useNativeDriver: true }).start()
    if (secondsLeft <= 0 && running) {
      setRunning(false)
      onBack()
    }
  }, [secondsLeft, running, targetScale, onBack, scale])

  const start = () => { setSecondsLeft(60); setRunning(true) }
  const stop = () => { setRunning(false); onBack() }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
            <Text style={styles.title}>Calming Breath</Text>
            <Text style={styles.subtitle}>{running ? 'Follow the rhythm' : 'Relax your mind'}</Text>
        </View>

        <View style={styles.visualizer}>
          <View style={styles.halo}>
            <Animated.Text style={[styles.raccoon, { transform: [{ scale }] }]}>🦝</Animated.Text>
          </View>
          <Text style={styles.timer}>{secondsLeft}s</Text>
        </View>

        <Text style={styles.phase}>{running ? phase : 'Ready?'}</Text>
        
        <View style={styles.barContainer}>
            <View style={styles.barOuter}>
            <View style={[styles.barInner, { width: running ? `${Math.max(0, 100 - secondsLeft)}%` : '0%' }]} />
            </View>
            <Text style={styles.barLabel}>{running ? 'Session Progress' : 'Start when ready'}</Text>
        </View>

        <View style={styles.buttons}>
          {!running && (
            <TouchableOpacity style={styles.primaryBtn} onPress={start}>
                <Text style={styles.primaryBtnText}>Start Session</Text>
            </TouchableOpacity>
          )}
          {running && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={stop}>
                <Text style={styles.secondaryBtnText}>End Session</Text>
            </TouchableOpacity>
          )}
          {!running && (
            <TouchableOpacity style={styles.ghostBtn} onPress={onBack}>
                <Text style={styles.ghostBtnText}>Back</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  card: { 
    width: '90%', 
    maxWidth: 400, 
    padding: 32, 
    backgroundColor: '#fff', 
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#2C3E50',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#95A5A6',
    fontWeight: '500',
  },
  visualizer: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginVertical: 20,
    height: 200,
  },
  halo: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#F3E5F5', // Light purple
    alignItems: 'center',
    justifyContent: 'center',
  },
  raccoon: { 
    fontSize: 80, 
    lineHeight: 100 
  },
  timer: { 
    position: 'absolute',
    bottom: -40,
    fontSize: 24, 
    fontWeight: '800', 
    color: '#2C3E50',
  },
  phase: { 
    textAlign: 'center', 
    fontSize: 24, 
    fontWeight: '700', 
    color: '#7C3AED',
    marginBottom: 32,
    marginTop: 20,
  },
  barContainer: {
    width: '100%',
    marginBottom: 32,
  },
  barOuter: { 
    height: 8, 
    backgroundColor: '#F0F3F4', 
    borderRadius: 4, 
    overflow: 'hidden',
    marginBottom: 8,
  },
  barInner: { 
    height: '100%', 
    backgroundColor: '#7C3AED',
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    color: '#95A5A6',
    textAlign: 'center',
  },
  buttons: { 
    width: '100%',
    gap: 12, 
  },
  primaryBtn: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  secondaryBtnText: {
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '700',
  },
  ghostBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ghostBtnText: {
    color: '#95A5A6',
    fontSize: 16,
    fontWeight: '600',
  },
})
