import { Router } from 'express'
import { requireAuth } from '../../middlewares/auth'
import { validate } from '../../middlewares/validate'
import { createReadingSchema, updateReadingSchema } from './schema'
import { index, show, create, update, destroy } from './controller'

export const readingRouter = Router()
readingRouter.use(requireAuth)
readingRouter.get('/', index)
readingRouter.get('/:id', show)
readingRouter.post('/', validate(createReadingSchema), create)
readingRouter.patch('/:id', validate(updateReadingSchema), update)
readingRouter.delete('/:id', destroy)