import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STRESS_NOTIFY_KEY = 'lastStressNotifyTs'
const HR_NOTIFY_KEY = 'lastHrNotifyTs'
const REMINDER_IDS_KEY = 'dailyReminderIds'

export async function initNotifications() {
  try {
    // Expo Go on Android might warn about remote notifications, but local should work.
    // We'll wrap this in a try/catch to ensure it doesn't block the app.
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }
      if (finalStatus !== 'granted') {
        return false
      }
      if (Platform.OS === 'android') {
         await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        })
      }
      return true
    }
    return false
  } catch (e) {
    console.log('Notification init failed (safe to ignore in Expo Go):', e)
    return false
  }
}

async function shouldRateLimit(key: string, windowMs: number) {
  const now = Date.now()
  const lastTsStr = await AsyncStorage.getItem(key)
  const lastTs = lastTsStr ? parseInt(lastTsStr, 10) : 0
  if (now - lastTs < windowMs) return true
  await AsyncStorage.setItem(key, String(now))
  return false
}

export async function alertHighStress(baselineHr: number | null, currentHr: number | null) {
  try {
    if (await shouldRateLimit(STRESS_NOTIFY_KEY, 60 * 60 * 1000)) return
    const body =
      baselineHr != null && currentHr != null
        ? `HR ${currentHr} vs baseline ${baselineHr}. Try a 60s calming breath.`
        : `Your stress indicators are elevated. Try a 60s calming breath.`
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Take a calming breath',
        body,
        data: { action: 'open_breathing' },
      },
      trigger: null,
    })
  } catch {}
}

export async function alertAbnormalHeartRate(hr: number | null) {
  try {
    if (hr == null) return
    if (await shouldRateLimit(HR_NOTIFY_KEY, 60 * 60 * 1000)) return
    if (hr < 50 || hr > 100) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Heart rate out of range',
          body: `Measured HR ${hr} bpm. Consider a breathing session.`,
          data: { action: 'open_breathing' },
        },
        trigger: null,
      })
    }
  } catch {}
}

export async function scheduleDailyReminders(hours: number[] = [9, 20]) {
  try {
    const ids: string[] = []
    for (const h of hours) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily breathing reminder',
          body: 'Take 60 seconds to breathe and reset.',
          data: { action: 'open_breathing' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.CALENDAR, hour: h, minute: 0, repeats: true },
      })
      ids.push(id)
    }
    await AsyncStorage.setItem(REMINDER_IDS_KEY, JSON.stringify(ids))
  } catch {}
}

export async function cancelDailyReminders() {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_IDS_KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    for (const id of ids) {
      await Notifications.cancelScheduledNotificationAsync(id)
    }
    await AsyncStorage.removeItem(REMINDER_IDS_KEY)
  } catch {}
}

export async function alertSessionCompleted() {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Breathing session complete',
        body: 'Nice work. Notice how you feel now.',
        data: { action: 'open_progress' },
      },
      trigger: null,
    })
  } catch {}
}
