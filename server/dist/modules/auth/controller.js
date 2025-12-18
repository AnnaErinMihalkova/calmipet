"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.revoke = exports.me = exports.refresh = exports.signin = exports.signup = void 0;
const service_1 = require("./service");
const client_1 = require("../../prisma/client");
const signup = async (req, res, next) => {
    try {
        const { email, username, password } = req.body;
        const result = await (0, service_1.register)(email, username, password);
        res.status(201).json({ user: { id: result.user.id, email: result.user.email, username: result.user.username, date_joined: result.user.createdAt }, accessToken: result.accessToken, refreshToken: result.refreshToken });
    }
    catch (err) {
        next(err);
    }
};
exports.signup = signup;
const signin = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await (0, service_1.login)(email, password);
        res.status(200).json({ user: { id: result.user.id, email: result.user.email, username: result.user.username, date_joined: result.user.createdAt }, accessToken: result.accessToken, refreshToken: result.refreshToken });
    }
    catch (err) {
        next(err);
    }
};
exports.signin = signin;
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        const tokens = await (0, service_1.rotateRefresh)(refreshToken);
        res.status(200).json(tokens);
    }
    catch (err) {
        next(err);
    }
};
exports.refresh = refresh;
const me = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        const user = await client_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'Not found' });
        res.status(200).json({ id: user.id, email: user.email, username: user.username, date_joined: user.createdAt });
    }
    catch (err) {
        next(err);
    }
};
exports.me = me;
const revoke = async (req, res, next) => {
    try {
        const userId = Number(req.userId);
        await (0, service_1.revokeAll)(userId);
        res.status(200).json({ revoked: true });
    }
    catch (err) {
        next(err);
    }
};
exports.revoke = revoke;
