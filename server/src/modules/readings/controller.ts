import { Request, Response, NextFunction } from 'express'
import { listReadings, getReading, createReading, updateReading, deleteReading } from './service'

export const index = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    const items = await listReadings(userId)
    res.status(200).json(items)
  } catch (err) { next(err) }
}

export const show = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    const item = await getReading(userId, req.params.id)
    res.status(200).json(item)
  } catch (err) { next(err) }
}

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    const item = await createReading(userId, req.body)
    res.status(201).json(item)
  } catch (err) { next(err) }
}

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    const item = await updateReading(userId, req.params.id, req.body)
    res.status(200).json(item)
  } catch (err) { next(err) }
}

export const destroy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Number((req as any).userId)
    const result = await deleteReading(userId, req.params.id)
    res.status(200).json(result)
  } catch (err) { next(err) }
}