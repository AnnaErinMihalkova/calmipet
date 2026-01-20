import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native'
import { authApi, userApi } from '../api/client'
import { useAuth } from '../context/AuthContext'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { setUserInfo } from '../services/storage'

export default function AccountScreen() {
  const { user, logout, updateUser } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [info, setInfo] = useState<any>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInfo()
  }, [])

  const loadInfo = async () => {
    try {
      const stored = await AsyncStorage.getItem('hb_user_info')
      if (stored) {
        setInfo(JSON.parse(stored))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const saveAccount = async () => {
    setLoading(true)
    try {
      const updated = await userApi.update(user.token, { username, email })
      updateUser(updated)
      Alert.alert('Success', 'Account updated successfully')
    } catch (e: any) {
      Alert.alert('Error', 'Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  const saveInfo = async () => {
    try {
      await setUserInfo(info)
      Alert.alert('Success', 'Info saved locally')
    } catch (e) {
      Alert.alert('Error', 'Failed to save info')
    }
  }

  const handleDelete = () => {
    Alert.alert('Delete Account', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await userApi.delete(user.token)
            logout()
          } catch (e) {
            Alert.alert('Error', 'Failed to delete account')
          }
        }
      }
    ])
  }

  const animals = [
    { key: 'raccoon', emoji: '🦝', label: 'Raccoon' },
    { key: 'cat', emoji: '🐱', label: 'Cat' },
    { key: 'fox', emoji: '🦊', label: 'Fox' },
    { key: 'owl', emoji: '🦉', label: 'Owl' },
  ]

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.headerTitle}>Account</Text>

      {/* Account Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Settings</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput 
            style={styles.input} 
            value={username} 
            onChangeText={setUsername}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            value={email} 
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <Text style={styles.meta}>Joined: {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '-'}</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={saveAccount} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? 'Saving...' : 'Save Account'}</Text>
        </TouchableOpacity>
      </View>

      {/* Personal Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Info</Text>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Age</Text>
            <TextInput 
              style={styles.input} 
              value={info.age || ''} 
              onChangeText={(t: string) => setInfo({...info, age: t})}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Baseline HR</Text>
            <TextInput 
              style={styles.input} 
              value={info.baselineHr || ''} 
              onChangeText={(t: string) => setInfo({...info, baselineHr: t})}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.genderRow}>
            {['Male', 'Female', 'Other'].map(g => (
              <TouchableOpacity 
                key={g}
                style={[styles.genderBtn, info.gender === g && styles.genderBtnActive]}
                onPress={() => setInfo({...info, gender: g})}
              >
                <Text style={[styles.genderText, info.gender === g && styles.genderTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.subTitle}>Choose Your Companion</Text>
        <View style={styles.animalGrid}>
          {animals.map((a, i) => (
            <TouchableOpacity 
              key={a.key}
              style={[
                styles.animalBtn, 
                i % 2 === 0 ? { marginRight: 8 } : {},
                info.petAnimal === a.key && styles.animalBtnActive
              ]}
              onPress={() => setInfo({...info, petAnimal: a.key})}
            >
              <Text style={styles.animalEmoji}>{a.emoji}</Text>
              <Text style={styles.animalLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={saveInfo}>
          <Text style={styles.primaryBtnText}>Save Info</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Account</Text>
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
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
    marginBottom: 16,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
    marginTop: 12,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  row: {
    flexDirection: 'row',
  },
  meta: {
    fontSize: 12,
    color: '#95A5A6',
    marginBottom: 16,
    textAlign: 'center',
  },
  primaryBtn: {
    backgroundColor: '#3498DB',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 10,
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: '#EBF5FB',
    borderColor: '#3498DB',
  },
  genderText: {
    color: '#7F8C8D',
    fontWeight: '500',
  },
  genderTextActive: {
    color: '#3498DB',
    fontWeight: '700',
  },
  animalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  animalBtn: {
    width: '48%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECF0F1',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  animalBtnActive: {
    backgroundColor: 'rgba(52, 152, 219, 0.10)',
    borderColor: '#3498DB',
  },
  animalEmoji: {
    fontSize: 22,
    lineHeight: 24,
    marginBottom: 4,
  },
  animalLabel: {
    fontSize: 10,
    color: '#7F8C8D',
  },
  dangerZone: {
    marginTop: 10,
    gap: 12,
  },
  logoutBtn: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BDC3C7',
  },
  logoutText: {
    color: '#E74C3C',
    fontWeight: '700',
  },
  deleteBtn: {
    alignItems: 'center',
    padding: 12,
  },
  deleteText: {
    color: '#E74C3C',
    fontSize: 14,
  },
})
