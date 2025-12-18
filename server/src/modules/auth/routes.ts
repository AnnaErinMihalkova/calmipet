import { Router } from 'express'
import { signup, signin, refresh, me, revoke } from './controller'
import { requireAuth } from '../../middlewares/auth'
import { validate } from '../../middlewares/validate'
import { signupSchema, loginSchema, refreshSchema } from './schema'

export const authRouter = Router()
authRouter.post('/signup', validate(signupSchema), signup)
authRouter.post('/login', validate(loginSchema), signin)
authRouter.post('/refresh', validate(refreshSchema), refresh)
authRouter.get('/me', requireAuth, me)
authRouter.post('/revoke', requireAuth, revoke)