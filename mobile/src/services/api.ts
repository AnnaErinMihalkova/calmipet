import axios from 'axios'

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api'
export const client = axios.create({ baseURL })

export const authApi = {
  signup: async (email: string, username: string, password: string) => {
    const res = await client.post('/auth/signup', { email, username, password })
    return res.data
  },
  login: async (email: string, password: string) => {
    const res = await client.post('/auth/login', { email, password })
    return res.data
  },
  refresh: async (refreshToken: string) => {
    const res = await client.post('/auth/refresh', { refreshToken })
    return res.data
  },
}

export const userApi = {
  me: async (accessToken: string) => {
    const res = await client.get('/users/me', { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
  update: async (accessToken: string, data: { username?: string; email?: string }) => {
    const res = await client.post('/users/update', data, { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
}