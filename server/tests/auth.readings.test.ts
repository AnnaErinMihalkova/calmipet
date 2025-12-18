import request from 'supertest'
import { describe, it, expect } from '@jest/globals'
import { app } from '../src/app'
 

const email = `tester+${Date.now()}@example.com`
const username = 'tester'
const password = 'Password123!'

describe('Auth and Readings flow', () => {
  it('signs up, logs in, creates and lists readings', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ email, username, password })
      .expect(201)
    expect(signupRes.body.accessToken).toBeTruthy()
    expect(signupRes.body.refreshToken).toBeTruthy()
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200)

    const access = loginRes.body.accessToken
    expect(access).toBeTruthy()

    const createRes = await request(app)
      .post('/api/readings')
      .set('Authorization', `Bearer ${access}`)
      .send({ title: 'Test Reading', value: 42 })
      .expect(201)

    const id = createRes.body.id
    expect(id).toBeTruthy()

    const listRes = await request(app)
      .get('/api/readings')
      .set('Authorization', `Bearer ${access}`)
      .expect(200)

    expect(Array.isArray(listRes.body)).toBe(true)
    expect(listRes.body.length).toBeGreaterThanOrEqual(1)
  })
})
