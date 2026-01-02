import axios from 'axios'

const baseURL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api'
export const client = axios.create({ baseURL })

export const authApi = {
  signup: async (email: string, username: string, password: string) => {
    const res = await client.post('/auth/signup/', { email, username, password })
    return res.data
  },
  login: async (email: string, password: string) => {
    const res = await client.post('/auth/login/', { email, password })
    return res.data
  },
  refresh: async (refreshToken: string) => {
    const res = await client.post('/auth/refresh/', { refreshToken })
    return res.data
  },
}

export const userApi = {
  me: async (accessToken: string) => {
    const res = await client.get('/auth/me/', { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
  update: async (accessToken: string, data: { username?: string; email?: string }) => {
    const res = await client.post('/auth/update/', data, { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
  resetData: async (accessToken: string) => {
    const res = await client.post('/privacy/reset-data/', { confirm: true }, { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
}

export const readingsApi = {
  create: async (accessToken: string, data: { hr: number; hrv?: number | null; ts?: string | Date }) => {
    const payload: any = { hr_bpm: data.hr }
    if (data.hrv !== undefined && data.hrv !== null) payload.hrv_rmssd = data.hrv
    if (data.ts) payload.ts = data.ts
    const res = await client.post('/readings/', payload, { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
  list: async (accessToken: string, page: number = 1, limit: number = 20) => {
    const res = await client.get('/readings/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const items = Array.isArray(res.data)
      ? res.data.map((r: any) => ({
          id: String(r.id),
          hr: r.hr_bpm ?? null,
          hrv: r.hrv_rmssd ?? null,
          createdAt: r.ts,
          userId: r.user,
        }))
      : []
    return {
      items,
      pagination: { page, limit, hasNext: false },
    }
  },
  get: async (accessToken: string, id: string) => {
    const res = await client.get(`/readings/${id}/`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const r = res.data
    return {
      id: String(r.id),
      hr: r.hr_bpm ?? null,
      hrv: r.hrv_rmssd ?? null,
      createdAt: r.ts,
      userId: r.user,
    }
  },
}

export const wellnessApi = {
  pet: async (accessToken: string) => {
    const res = await client.get('/pets/mine/', { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
  streak: async (accessToken: string) => {
    const res = await client.get('/streaks/mine/', { headers: { Authorization: `Bearer ${accessToken}` } })
    return res.data
  },
}
