import { prisma } from '../../prisma/client'

export const listReadings = async (userId: number) => {
  return prisma.reading.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
}

export const findPaginated = async (userId: number, page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit
  const take = limit

  const [items, total] = await Promise.all([
    prisma.reading.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.reading.count({ where: { userId } }),
  ])

  const totalPages = Math.ceil(total / limit)

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  }
}

export const getReading = async (userId: number, id: string) => {
  const reading = await prisma.reading.findUnique({
    where: { id },
    include: { user: { select: { id: true, username: true, email: true } } },
  })
  if (!reading || reading.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 })
  return reading
}

export const createReading = async (userId: number, data: { hr: number; hrv?: number | null; ts?: string | Date }) => {
  const readingData: any = { userId, hr: data.hr }
  
  if (data.hrv !== undefined) {
    readingData.hrv = data.hrv
  }
  
  if (data.ts) {
    readingData.createdAt = data.ts instanceof Date ? data.ts : new Date(data.ts)
  }
  
  return prisma.reading.create({ data: readingData })
}

export const updateReading = async (userId: number, id: string, data: { hr?: number; hrv?: number | null }) => {
  const existing = await prisma.reading.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 })
  
  const updateData: any = {}
  if (data.hr !== undefined) updateData.hr = data.hr
  if (data.hrv !== undefined) updateData.hrv = data.hrv
  
  return prisma.reading.update({ where: { id }, data: updateData })
}

export const deleteReading = async (userId: number, id: string) => {
  const existing = await prisma.reading.findUnique({ where: { id } })
  if (!existing || existing.userId !== userId) throw Object.assign(new Error('Not found'), { status: 404 })
  await prisma.reading.delete({ where: { id } })
  return { deleted: true }
}