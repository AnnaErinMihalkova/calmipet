import { prisma } from '../src/prisma/client'
import { beforeEach, afterAll } from '@jest/globals'

beforeEach(async () => {
  await prisma.refreshToken.deleteMany({})
  await prisma.reading.deleteMany({})
  await prisma.user.deleteMany({})
})

afterAll(async () => {
  await prisma.$disconnect()
})