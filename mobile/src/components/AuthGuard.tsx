import React from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../context/AuthContext'
import AuthScreen from '../screens/AuthScreen'

type Props = { children: React.ReactNode }

export default function AuthGuard({ children }: Props) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }
  if (!user) {
    return <AuthScreen />
  }
  return <>{children}</>
}