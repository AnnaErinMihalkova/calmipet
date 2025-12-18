import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth'
import { prisma } from '../../prisma/client'

export const userRouter = Router()
userRouter.get('/me', requireAuth, async (req, res) => {
  const id = Number((req as any).userId)
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return res.status(404).json({ error: 'Not found' })
  res.json({ id: user.id, email: user.email, username: user.username, date_joined: user.createdAt })
})
userRouter.post('/update', requireAuth, async (req, res) => {
  const id = Number((req as any).userId)
  const { username, email } = req.body || {}
  let data: any = {}
  if (username) data.username = username
  if (email) {
    const exists = await prisma.user.findUnique({ where: { email } })
    if (exists && exists.id !== id) return res.status(400).json({ email: ['A user with this email already exists.'] })
    data.email = email
  }
  const user = await prisma.user.update({ where: { id }, data })
  res.json({ id: user.id, email: user.email, username: user.username, date_joined: user.createdAt })
})