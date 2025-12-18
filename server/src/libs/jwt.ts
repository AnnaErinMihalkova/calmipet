import jwt, { JwtPayload } from 'jsonwebtoken'
import { env } from '../config/env'

export type AccessPayload = { sub: string }
export type RefreshPayload = { sub: string }

export const signAccess = (payload: AccessPayload) => jwt.sign(payload, env.accessTokenSecret as jwt.Secret, { expiresIn: env.accessTokenTtl as jwt.SignOptions['expiresIn'] })
export const verifyAccess = (token: string): AccessPayload => {
  const decoded = jwt.verify(token, env.accessTokenSecret as jwt.Secret) as JwtPayload | string
  if (typeof decoded === 'string') throw new Error('Unauthorized')
  const sub = decoded.sub
  if (!sub) throw new Error('Unauthorized')
  return { sub: String(sub) }
}

export const signRefresh = (payload: RefreshPayload) => jwt.sign(payload, env.refreshTokenSecret as jwt.Secret, { expiresIn: env.refreshTokenTtl as jwt.SignOptions['expiresIn'] })
export const verifyRefresh = (token: string): RefreshPayload => {
  const decoded = jwt.verify(token, env.refreshTokenSecret as jwt.Secret) as JwtPayload | string
  if (typeof decoded === 'string') throw new Error('Unauthorized')
  const sub = decoded.sub
  if (!sub) throw new Error('Unauthorized')
  return { sub: String(sub) }
}