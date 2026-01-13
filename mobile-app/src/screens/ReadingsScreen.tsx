import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, Platform } from 'react-native'
import { readingsApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import * as FileSystem from 'expo-file-system'
import * as Sharing from 'expo-sharing'

export default function ReadingsScreen({ onAdd }: { onAdd: () => void }) {
  const { user } = useAuth()
  const [readings, setReadings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchReadings = async () => {
    try {
      if (!user?.token) return
      const res = await readingsApi.list(user.token)
      setReadings(res.items || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchReadings()
  }, [])

  const handleExport = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Export is only available on mobile devices')
      return
    }

    try {
      const csvHeader = 'Date,Heart Rate (BPM),HRV (ms)\n'
      const csvRows = readings.map(r => 
        `${new Date(r.createdAt).toISOString()},${r.hr},${r.hrv || ''}`
      ).join('\n')
      
      const docDir = (FileSystem as any).documentDirectory || (FileSystem as any).cacheDirectory || ''
      const fileUri = docDir + 'readings.csv'
      await FileSystem.writeAsStringAsync(fileUri, csvHeader + csvRows)
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri)
      } else {
        Alert.alert('Error', 'Sharing is not available on this device')
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to export readings')
      console.error(e)
    }
  }

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        <Text style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
      </View>
      <View style={styles.metricsRow}>
        <View>
          <Text style={styles.metricLabel}>Heart Rate</Text>
          <Text style={styles.metricValue}>{item.hr} <Text style={styles.unit}>BPM</Text></Text>
        </View>
        <View style={{alignItems: 'flex-end'}}>
          <Text style={styles.metricLabel}>HRV</Text>
          <Text style={styles.metricValue}>{item.hrv || '--'} <Text style={styles.unit}>ms</Text></Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Readings</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity onPress={handleExport} style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>📤</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={readings}
        renderItem={renderItem}
        keyExtractor={(item: any) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true)
          fetchReadings()
        }}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No readings yet</Text> : null
        }
      />
      <View style={{height: 60}} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2C3E50',
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
  },
  iconBtnText: {
    fontSize: 18,
  },
  addBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#3498DB',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '600',
    marginTop: -2,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F4',
    paddingBottom: 8,
  },
  date: {
    color: '#2C3E50',
    fontWeight: '600',
    fontSize: 14,
  },
  time: {
    color: '#95A5A6',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
  },
  unit: {
    fontSize: 12,
    color: '#BDC3C7',
    fontWeight: '400',
  },
  emptyText: {
    textAlign: 'center',
    color: '#95A5A6',
    marginTop: 40,
  },
})
