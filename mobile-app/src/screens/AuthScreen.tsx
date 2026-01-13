import React from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Dimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../context/AuthContext'

const { width } = Dimensions.get('window')

export default function AuthScreen() {
  const { signup: ctxSignup, login: ctxLogin } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [message, setMessage] = React.useState('')
  const [isLogin, setIsLogin] = React.useState(true) // Toggle between Login and Signup
  const [petEmoji, setPetEmoji] = React.useState('🦝')

  React.useEffect(() => {
    const loadPet = async () => {
      try {
        const stored = await AsyncStorage.getItem('hb_user_info')
        if (stored) {
          const info = JSON.parse(stored)
          const map: Record<string, string> = { raccoon: '🦝', cat: '🐱', dog: '🐶', fox: '🦊', owl: '🦉' }
          if (info.petAnimal && map[info.petAnimal]) setPetEmoji(map[info.petAnimal])
        }
      } catch {}
    }
    loadPet()
  }, [])

  const handleSubmit = async () => {
    setMessage('')
    try {
      if (isLogin) {
        await ctxLogin(email, password)
        setMessage('Logged in successfully')
      } else {
        await ctxSignup(email, email.split('@')[0], password)
        setMessage('Account created successfully')
      }
    } catch (e: any) {
      const status = e?.response?.status
      const detail = e?.response?.data?.error || e?.response?.data?.message
      if (!status) {
        setMessage('Network error: Ensure phone and PC are on same Wi-Fi (192.168.0.78)')
      } else {
        setMessage(String(detail || e?.message || 'Authentication failed'))
      }
    }
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>CalmiPet {petEmoji}</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="hello@calmipet.com" 
              placeholderTextColor="#999"
              value={email} 
              onChangeText={setEmail} 
              autoCapitalize="none" 
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput 
              style={styles.input} 
              placeholder="••••••••" 
              placeholderTextColor="#999"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
          </View>

          {!!message && <Text style={styles.message}>{message}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleSubmit}>
            <Text style={styles.buttonText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchButton} 
            onPress={() => {
              setIsLogin(!isLogin)
              setMessage('')
            }}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchTextBold}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Light blue-grey background
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4, // Android shadow
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495E',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8F9F9',
    borderWidth: 1,
    borderColor: '#E5E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#2C3E50',
  },
  button: {
    backgroundColor: '#3498DB', // Calming Blue
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  switchTextBold: {
    color: '#3498DB',
    fontWeight: '700',
  },
  message: {
    marginBottom: 16,
    color: '#E74C3C', // Red for errors
    textAlign: 'center',
    fontSize: 14,
  },
})
