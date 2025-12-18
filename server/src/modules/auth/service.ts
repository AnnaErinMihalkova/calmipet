import { prisma } from '../../prisma/client'
import { hash, compare } from '../../libs/hashing'
import { signAccess, signRefresh } from '../../libs/jwt'
import crypto from 'crypto'

export const register = async (email: string, username: string, password: string) => {
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) throw Object.assign(new Error('Email already in use'), { status: 409 })
  const passwordHash = await hash(password)
  const user = await prisma.user.create({ data: { email, username, passwordHash } })
  const tokens = await issueTokens(String(user.id))
  return { user, ...tokens }
}

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) throw Object.assign(new Error('Invalid email or password'), { status: 401 })
  const ok = await compare(password, user.passwordHash)
  if (!ok) throw Object.assign(new Error('Invalid email or password'), { status: 401 })
  const tokens = await issueTokens(String(user.id))
  return { user, ...tokens }
}

export const issueTokens = async (userId: string) => {
  const accessToken = signAccess({ sub: userId })
  const refreshToken = signRefresh({ sub: userId })
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const ttlMs = 7 * 24 * 60 * 60 * 1000
  const expiresAt = new Date(Date.now() + ttlMs)
  await prisma.refreshToken.create({ data: { userId: Number(userId), tokenHash, expiresAt } })
  return { accessToken, refreshToken }
}

export const rotateRefresh = async (refreshToken: string) => {
  const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex')
  const record = await prisma.refreshToken.findFirst({ where: { tokenHash, revoked: false } })
  if (!record || record.expiresAt < new Date()) throw Object.assign(new Error('Invalid refresh token'), { status: 400 })
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } })
  return issueTokens(String(record.userId))
}

export const revokeAll = async (userId: number) => {
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } })
}