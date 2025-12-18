import { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../libs/jwt'

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const payload = verifyAccess(token)
    ;(req as any).userId = payload.sub
    next()
  } catch {
    return res.status(401).json({ error: 'Unauthorized' })
  }
}