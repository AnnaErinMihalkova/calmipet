import React from 'react'
import { View, Text, StyleSheet, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { useAuth } from '../context/AuthContext'
import { readingsApi } from '../services/api'
import { getTokens } from '../services/storage'

type Reading = {
  id: string
  hr: number | null
  hrv: number | null
  createdAt: string
  userId: number
}

type ViewType = 'daily' | 'weekly' | 'monthly'

type Props = {
  limit?: number // Number of readings to fetch (default: 50)
}

export default function HRLineChart({ limit = 50 }: Props) {
  const { user } = useAuth()
  const [readings, setReadings] = React.useState<Reading[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [viewType, setViewType] = React.useState<ViewType>('daily')

  React.useEffect(() => {
    fetchReadings()
  }, [limit])

  const fetchReadings = async () => {
    setLoading(true)
    setError(null)
    try {
      const { accessToken } = await getTokens()
      if (!accessToken) {
        throw new Error('Not authenticated')
      }

      // Fetch multiple pages if needed to get enough readings
      let allReadings: Reading[] = []
      let page = 1
      const pageSize = 20

      while (allReadings.length < limit) {
        const result = await readingsApi.list(accessToken, page, pageSize)
        if (!result.items || result.items.length === 0) break
        allReadings = [...allReadings, ...result.items]
        if (!result.pagination.hasNext || allReadings.length >= limit) break
        page++
      }

      // Limit to requested number and filter out readings without HR
      const validReadings = allReadings
        .filter((r) => r.hr !== null && r.hr !== undefined)
        .slice(0, limit)
        .reverse() // Reverse to show oldest to newest

      setReadings(validReadings)
    } catch (e: any) {
      const errorMessage = e?.response?.data?.message || e?.message || 'Failed to load readings'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Filter readings based on selected view type
  const getFilteredReadings = () => {
    const now = new Date()
    const cutoffDate = new Date()

    switch (viewType) {
      case 'daily':
        cutoffDate.setHours(now.getHours() - 24)
        break
      case 'weekly':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case 'monthly':
        cutoffDate.setMonth(now.getMonth() - 1)
        break
    }

    return readings.filter((r) => {
      const readingDate = new Date(r.createdAt)
      return readingDate >= cutoffDate
    })
  }

  const filteredReadings = getFilteredReadings()

  const formatTime = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      const hours = date.getHours()
      const minutes = date.getMinutes()
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    } catch {
      return ''
    }
  }

  const formatDate = (timestamp: string): string => {
    try {
      const date = new Date(timestamp)
      const month = date.getMonth() + 1
      const day = date.getDate()
      return `${month}/${day}`
    } catch {
      return ''
    }
  }

  const formatLabel = (timestamp: string): string => {
    const date = new Date(timestamp)
    const now = new Date()

    if (viewType === 'daily') {
      return formatTime(timestamp)
    } else if (viewType === 'weekly') {
      const isToday = date.toDateString() === now.toDateString()
      if (isToday) return 'Today'
      const isYesterday = date.toDateString() === new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString()
      if (isYesterday) return 'Yesterday'
      return formatDate(timestamp)
    } else {
      // Monthly view
      return formatDate(timestamp)
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading chart data...</Text>
        </View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    )
  }

  if (readings.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.chartContainer}>
          <Text style={styles.emptyText}>No readings available</Text>
        </View>
      </View>
    )
  }

  const screenWidth = Dimensions.get('window').width
  const chartWidth = Math.max(screenWidth - 40, 300)

  // Check if any filtered readings have HRV data
  const hasHRVData = filteredReadings.some((r) => r.hrv !== null && r.hrv !== undefined)

  // Prepare data for HR chart
  const hrData = filteredReadings.map((r) => r.hr || 0)
  const labels = filteredReadings.map((r) => formatLabel(r.createdAt))

  // Reduce label density if too many points
  const labelStep = Math.max(1, Math.floor(labels.length / 6))
  const displayLabels = labels.map((label, index) => (index % labelStep === 0 ? label : ''))

  // Prepare HRV data if available
  const hrvData = hasHRVData ? filteredReadings.map((r) => r.hrv || 0) : []

  const hrChartData = {
    labels: displayLabels,
    datasets: [
      {
        data: hrData,
        color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`, // iOS blue
        strokeWidth: 2,
      },
    ],
  }

  const hrvChartData = hasHRVData
    ? {
        labels: displayLabels,
        datasets: [
          {
            data: hrvData,
            color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`, // iOS green
            strokeWidth: 2,
          },
        ],
      }
    : null

  const hrChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#007AFF',
    },
  }

  const hrvChartConfig = {
    backgroundColor: '#ffffff',
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#34C759',
    },
  }

  return (
    <View style={styles.container}>
      {/* View Type Toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, viewType === 'daily' && styles.toggleButtonActive]}
          onPress={() => setViewType('daily')}
        >
          <Text style={[styles.toggleText, viewType === 'daily' && styles.toggleTextActive]}>Daily</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewType === 'weekly' && styles.toggleButtonActive]}
          onPress={() => setViewType('weekly')}
        >
          <Text style={[styles.toggleText, viewType === 'weekly' && styles.toggleTextActive]}>Weekly</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewType === 'monthly' && styles.toggleButtonActive]}
          onPress={() => setViewType('monthly')}
        >
          <Text style={[styles.toggleText, viewType === 'monthly' && styles.toggleTextActive]}>Monthly</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.title}>Heart Rate Trend</Text>
        <Text style={styles.subtitle}>
          {filteredReadings.length} readings ({viewType === 'daily' ? 'last 24h' : viewType === 'weekly' ? 'last 7 days' : 'last month'})
        </Text>
        <LineChart
          data={hrChartData}
          width={chartWidth}
          height={220}
          chartConfig={hrChartConfig}
          bezier // Smooth curves
          style={styles.chart}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          withInnerLines={true}
          withOuterLines={false}
          withDots={filteredReadings.length <= 20} // Show dots only if not too many points
          withShadow={false}
          yAxisLabel=""
          yAxisSuffix=" BPM"
          yAxisInterval={1}
          segments={4}
        />
      </View>

      {hasHRVData && hrvChartData && (
        <View style={styles.chartContainer}>
          <Text style={styles.title}>Heart Rate Variability Trend</Text>
          <Text style={styles.subtitle}>
            {filteredReadings.filter((r) => r.hrv !== null && r.hrv !== undefined).length} readings with HRV
          </Text>
          <LineChart
            data={hrvChartData}
            width={chartWidth}
            height={220}
            chartConfig={hrvChartConfig}
            bezier // Smooth curves
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={false}
            withDots={filteredReadings.length <= 20} // Show dots only if not too many points
            withShadow={false}
            yAxisLabel=""
            yAxisSuffix=" ms"
            yAxisInterval={1}
            segments={4}
          />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    width: '90%',
    maxWidth: 420,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#007AFF',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  chartContainer: {
    width: '90%',
    maxWidth: 420,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
  },
})

