import React from 'react'
import { View, Text, Button, StyleSheet, Animated } from 'react-native'

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
        <Text style={styles.title}>Calming Breath</Text>
        <View style={styles.center}>
          <Animated.Text style={[styles.raccoon, { transform: [{ scale }] }]}>🦝</Animated.Text>
          <Text style={styles.timer}>{secondsLeft}s</Text>
        </View>
        <Text style={styles.phase}>{running ? phase : 'Press Start'}</Text>
        <View style={styles.barOuter}>
          <View style={[styles.barInner, { width: running ? `${Math.max(0, 100 - secondsLeft)}%` : '0%' }]} />
        </View>
        <View style={styles.buttons}>
          {!running && <Button title="Start" onPress={start} />}
          {running && <Button title="End" onPress={stop} />}
          {!running && <Button title="Back" onPress={onBack} />}
        </View>
        <Text style={styles.hint}>Follow the raccoon: inhale, hold, exhale</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  card: { width: '90%', maxWidth: 460, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 12 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  center: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  raccoon: { fontSize: 120, lineHeight: 120 },
  timer: { fontSize: 28, fontWeight: '800', marginTop: 8 },
  phase: { textAlign: 'center', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  barOuter: { height: 8, backgroundColor: '#eee', borderRadius: 4 },
  barInner: { height: 8, borderRadius: 4, backgroundColor: '#7C3AED' },
  buttons: { marginTop: 12, gap: 8 },
  hint: { textAlign: 'center', marginTop: 12, color: '#666' },
})
