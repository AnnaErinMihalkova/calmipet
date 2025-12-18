import React from 'react'
import { View, Text, TextInput, Button, StyleSheet } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function AuthScreen() {
  const { signup: ctxSignup, login: ctxLogin } = useAuth()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [message, setMessage] = React.useState('')

  const signup = async () => {
    setMessage('')
    try {
      await ctxSignup(email, email.split('@')[0], password)
      setMessage('Signed up and logged in')
    } catch (e: any) {
      setMessage(String(e?.message || 'Signup failed'))
    }
  }

  const login = async () => {
    setMessage('')
    try {
      await ctxLogin(email, password)
      setMessage('Logged in')
    } catch (e: any) {
      setMessage(String(e?.message || 'Login failed'))
    }
  }

  return (
    <View style={styles.card}>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
      <View style={styles.row}>
        <Button title="Sign Up" onPress={signup} />
        <View style={{ width: 8 }} />
        <Button title="Log In" onPress={login} />
      </View>
      {!!message && <Text style={styles.message}>{message}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  card: { width: '90%', maxWidth: 420, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 8, marginBottom: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  message: { marginTop: 8, color: '#555' },
})