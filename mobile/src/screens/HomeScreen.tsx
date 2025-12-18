import React from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'

type Props = { user: any; onLogout: () => void }

export default function HomeScreen({ user, onLogout }: Props) {
  return (
    <View style={styles.card}>
      <Text>Welcome, {user.username}</Text>
      <Text>{user.email}</Text>
      <Button title="Log Out" onPress={onLogout} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: { width: '90%', maxWidth: 420, padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 },
})