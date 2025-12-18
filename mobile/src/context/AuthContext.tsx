import React from 'react'
import { authApi, userApi } from '../services/api'
import { getTokens, saveTokens, clearTokens } from '../services/storage'

type AuthContextValue = {
  user: any | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<any | null>(null)
  const [loading, setLoading] = React.useState(true)

  const restore = React.useCallback(async () => {
    try {
      const { accessToken, refreshToken } = await getTokens()
      if (!accessToken) return
      try {
        const me = await userApi.me(accessToken)
        setUser(me)
      } catch {
        if (!refreshToken) return
        const rotated = await authApi.refresh(refreshToken)
        await saveTokens(rotated.accessToken, rotated.refreshToken)
        const me = await userApi.me(rotated.accessToken)
        setUser(me)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { restore() }, [restore])

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password)
    await saveTokens(result.accessToken, result.refreshToken)
    setUser(result.user)
  }

  const signup = async (email: string, username: string, password: string) => {
    const result = await authApi.signup(email, username, password)
    await saveTokens(result.accessToken, result.refreshToken)
    setUser(result.user)
  }

  const logout = async () => {
    await clearTokens()
    setUser(null)
  }

  const value: AuthContextValue = { user, loading, login, signup, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('AuthContext missing')
  return ctx
}