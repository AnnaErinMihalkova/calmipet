import { prisma } from '../../prisma/client'

export const listReadings = async (userId: number) => {
  return prisma.reading.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
}

export const getReading = async (userId: number, id: string) => {
  const reading = await prisma.reading.findUnique({ where: { id } })
  if (!reading || reading.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 })
  return reading
}

export const createReading = async (userId: number, data: { title: string; value: number }) => {
  return prisma.reading.create({ data: { userId, title: data.title, value: data.value } })
}

export const updateReading = async (userId: number, id: string, data: { title?: string; value?: number }) => {
  const existing = await prisma.reading.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 })
  return prisma.reading.update({ where: { id }, data })
}

export const deleteReading = async (userId: number, id: string) => {
  const existing = await prisma.reading.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 })
  await prisma.reading.delete({ where: { id } })
  return { deleted: true }
}