"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../../middlewares/auth");
const client_1 = require("../../prisma/client");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get('/me', auth_1.requireAuth, async (req, res) => {
    const id = Number(req.userId);
    const user = await client_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        return res.status(404).json({ error: 'Not found' });
    res.json({ id: user.id, email: user.email, username: user.username, date_joined: user.createdAt });
});
exports.userRouter.post('/update', auth_1.requireAuth, async (req, res) => {
    const id = Number(req.userId);
    const { username, email } = req.body || {};
    let data = {};
    if (username)
        data.username = username;
    if (email) {
        const exists = await client_1.prisma.user.findUnique({ where: { email } });
        if (exists && exists.id !== id)
            return res.status(400).json({ email: ['A user with this email already exists.'] });
        data.email = email;
    }
    const user = await client_1.prisma.user.update({ where: { id }, data });
    res.json({ id: user.id, email: user.email, username: user.username, date_joined: user.createdAt });
});
