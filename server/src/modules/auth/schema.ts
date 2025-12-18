import { z } from 'zod'

export const signupSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(8),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
})