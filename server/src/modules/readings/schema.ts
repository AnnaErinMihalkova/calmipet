import { z } from 'zod'

export const createReadingSchema = z.object({
  title: z.string().min(1),
  value: z.number().int(),
})

export const updateReadingSchema = z.object({
  title: z.string().min(1).optional(),
  value: z.number().int().optional(),
})