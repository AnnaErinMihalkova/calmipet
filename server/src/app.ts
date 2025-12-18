import express from 'express'
import cors from 'cors'
// @ts-ignore
import morgan from 'morgan'
import { env } from './config/env'
import { errorHandler } from './middlewares/error'
import { authRouter } from './modules/auth/routes'
import { userRouter } from './modules/user/routes'
import { readingRouter } from './modules/readings/routes'

export const app = express()
app.use(cors({ origin: '*', credentials: false }))
app.use(express.json())
app.use(morgan('dev'))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/readings', readingRouter)

app.use(errorHandler)