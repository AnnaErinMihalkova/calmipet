export type ReadingLite = { hr: number | null; hrv?: number | null; createdAt?: string }

export const hrvToStressLabel = (hrv: number | null) =>
  hrv == null ? 'Unknown' : hrv < 30 ? 'High' : hrv < 50 ? 'Medium' : 'Low'

export const hrvToCoherenceLabel = (hrv: number | null) =>
  hrv == null ? 'Unknown' : hrv >= 60 ? 'High' : hrv >= 40 ? 'Medium' : 'Low'

export const computeBaselineHR = (readings: ReadingLite[], samples: number = 10): number | null => {
  const recent = readings.slice(-samples).map(r => r.hr).filter((v): v is number => typeof v === 'number')
  if (!recent.length) return null
  return Math.round(recent.reduce((s, v) => s + v, 0) / recent.length)
}

export const summarizeDay = (readings: ReadingLite[]) => {
  const count = readings.length
  const hrValues = readings.map(r => r.hr || 0)
  const avg = count ? Math.round(hrValues.reduce((s, v) => s + v, 0) / count) : null
  const min = count ? Math.min(...hrValues) : null
  const max = count ? Math.max(...hrValues) : null
  const hrvValues = readings.map(r => r.hrv || 0)
  const avgHrv = count ? hrvValues.reduce((s, v) => s + v, 0) / count : null
  const moodLabel = hrvToStressLabel(avgHrv)
  return { count, avg, min, max, avgHrv, moodLabel }
}
