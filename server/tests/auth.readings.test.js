"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../src/app");
const email = `tester+${Date.now()}@example.com`;
const username = 'tester';
const password = 'Password123!';
describe('Auth and Readings flow', () => {
    it('signs up, logs in, creates and lists readings', async () => {
        const signupRes = await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/signup')
            .send({ email, username, password })
            .expect(201);
        expect(signupRes.body.accessToken).toBeTruthy();
        expect(signupRes.body.refreshToken).toBeTruthy();
        const loginRes = await (0, supertest_1.default)(app_1.app)
            .post('/api/auth/login')
            .send({ email, password })
            .expect(200);
        const access = loginRes.body.accessToken;
        expect(access).toBeTruthy();
        const createRes = await (0, supertest_1.default)(app_1.app)
            .post('/api/readings')
            .set('Authorization', `Bearer ${access}`)
            .send({ title: 'Test Reading', value: 42 })
            .expect(201);
        const id = createRes.body.id;
        expect(id).toBeTruthy();
        const listRes = await (0, supertest_1.default)(app_1.app)
            .get('/api/readings')
            .set('Authorization', `Bearer ${access}`)
            .expect(200);
        expect(Array.isArray(listRes.body)).toBe(true);
        expect(listRes.body.length).toBeGreaterThanOrEqual(1);
    });
});
