import dotenv from 'dotenv'
dotenv.config()

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || 'dev-access-secret',
  refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || 'dev-refresh-secret',
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL || '15m',
  refreshTokenTtl: process.env.REFRESH_TOKEN_TTL || '7d',
}