import { z } from 'zod'

export const createReadingSchema = z.object({
  hr: z.number().int().min(30).max(220),
  hrv: z.number().min(10).max(200).optional().nullable(),
  ts: z.union([z.string().datetime(), z.date()]).optional(),
})

export const updateReadingSchema = z.object({
  hr: z.number().int().min(30).max(220).optional(),
  hrv: z.number().min(10).max(200).optional().nullable(),
})