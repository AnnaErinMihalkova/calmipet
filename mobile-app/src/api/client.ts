import axios from 'axios'
import { getBaseUrl } from '../config'

const REQUEST_TIMEOUT_MS = 20000

export const client = axios.create({
  baseURL: getBaseUrl(),
  timeout: REQUEST_TIMEOUT_MS,
})

client.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl()
  return config
})

async function loginResponse(email: string, password: string) {
  const { data } = await client.post<{ token: string; user_id: number }>('/auth/login/', {
    email,
    password,
  })
  const { data: user } = await client.get('/auth/me/', {
    headers: { Authorization: `Bearer ${data.token}` },
  })
  return { accessToken: data.token, refreshToken: '', user }
}

export const authApi = {
  signup: async (email: string, username: string, password: string) => {
    const { data } = await client.post<{ token: string; user_id: number }>('/auth/register/', {
      email,
      username,
      password,
    })
    const { data: user } = await client.get('/auth/me/', {
      headers: { Authorization: `Bearer ${data.token}` },
    })
    return { accessToken: data.token, refreshToken: '', user }
  },
  login: loginResponse,
  refresh: async (_refreshToken: string) => {
    throw new Error('Refresh tokens are not supported by this API')
  },
}

export const userApi = {
  me: async (accessToken: string) => {
    const res = await client.get('/auth/me/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  update: async (accessToken: string, data: { username?: string; email?: string }) => {
    const res = await client.post('/auth/update/', data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  delete: async (accessToken: string) => {
    const res = await client.delete('/auth/delete/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  resetData: async (accessToken: string) => {
    const res = await client.post(
      '/privacy/reset-data/',
      { confirm: true },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return res.data
  },
}

export const readingsApi = {
  create: async (
    accessToken: string,
    data: { hr: number; hrv?: number | null; ts?: string | Date }
  ) => {
    const payload: Record<string, unknown> = { hr_bpm: data.hr }
    if (data.hrv !== undefined && data.hrv !== null) payload.hrv_rmssd = data.hrv
    if (data.ts) payload.ts = data.ts
    const res = await client.post('/readings/', payload, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  list: async (accessToken: string, page: number = 1, limit: number = 20) => {
    const res = await client.get('/readings/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const items = Array.isArray(res.data)
      ? res.data.map((r: Record<string, unknown>) => ({
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
    const res = await client.get('/pets/mine/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  updatePet: async (
    accessToken: string,
    data: { xp_delta?: number; level?: number; mood?: string; pet_animal?: string }
  ) => {
    const res = await client.post('/pets/mine/update/', data, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  streak: async (accessToken: string) => {
    const res = await client.get('/streaks/mine/', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    return res.data
  },
  createBreathingSession: async (accessToken: string) => {
    const res = await client.post(
      '/breathing-sessions/',
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return res.data
  },
  completeBreathingSession: async (accessToken: string, id: number) => {
    const res = await client.post(
      `/breathing-sessions/${id}/complete/`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    return res.data
  },
}
