import { Request, Response, NextFunction } from 'express'
import { register, login, rotateRefresh, revokeAll } from './service'
import { prisma } from '../../prisma/client'

export const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, username, password } = req.body as any
    const result = await register(email, username, password)
    res.status(201).json({ user: { id: result.user.id, email: result.user.email, username: result.user.username, date_joined: result.user.createdAt }, accessToken: result.accessToken, refreshToken: result.refreshToken })
  } catch (err) { next(err) }
}

export const signin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body as any
    const result = await login(email, password)
    res.status(200).json({ user: { id: result.user.id, email: result.user.email, username: result.user.username, date_joined: result.user.createdAt }, accessToken: result.accessToken, refreshToken: result.refreshToken })
  } catch (err) { next(err) }
}

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body as any
    const tokens = await rotateRefresh(refreshToken)
    res.status(200).json(tokens)
  } catch (err) { next(err) }
}

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.status(200).json({ id: user.id, email: user.email, username: user.username, date_joined: user.createdAt })
  } catch (err) { next(err) }
}

export const revoke = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    await revokeAll(userId)
    res.status(200).json({ revoked: true })
  } catch (err) { next(err) }
}