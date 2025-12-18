"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.revokeAll = exports.rotateRefresh = exports.issueTokens = exports.login = exports.register = void 0;
const client_1 = require("../../prisma/client");
const hashing_1 = require("../../libs/hashing");
const jwt_1 = require("../../libs/jwt");
const crypto_1 = __importDefault(require("crypto"));
const register = async (email, username, password) => {
    const exists = await client_1.prisma.user.findUnique({ where: { email } });
    if (exists)
        throw Object.assign(new Error('Email already in use'), { status: 409 });
    const passwordHash = await (0, hashing_1.hash)(password);
    const user = await client_1.prisma.user.create({ data: { email, username, passwordHash } });
    const tokens = await (0, exports.issueTokens)(String(user.id));
    return { user, ...tokens };
};
exports.register = register;
const login = async (email, password) => {
    const user = await client_1.prisma.user.findUnique({ where: { email } });
    if (!user)
        throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    const ok = await (0, hashing_1.compare)(password, user.passwordHash);
    if (!ok)
        throw Object.assign(new Error('Invalid email or password'), { status: 401 });
    const tokens = await (0, exports.issueTokens)(String(user.id));
    return { user, ...tokens };
};
exports.login = login;
const issueTokens = async (userId) => {
    const accessToken = (0, jwt_1.signAccess)({ sub: userId });
    const refreshToken = (0, jwt_1.signRefresh)({ sub: userId });
    const tokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
    const ttlMs = 7 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + ttlMs);
    await client_1.prisma.refreshToken.create({ data: { userId: Number(userId), tokenHash, expiresAt } });
    return { accessToken, refreshToken };
};
exports.issueTokens = issueTokens;
const rotateRefresh = async (refreshToken) => {
    const tokenHash = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
    const record = await client_1.prisma.refreshToken.findFirst({ where: { tokenHash, revoked: false } });
    if (!record || record.expiresAt < new Date())
        throw Object.assign(new Error('Invalid refresh token'), { status: 400 });
    await client_1.prisma.refreshToken.update({ where: { id: record.id }, data: { revoked: true } });
    return (0, exports.issueTokens)(String(record.userId));
};
exports.rotateRefresh = rotateRefresh;
const revokeAll = async (userId) => {
    await client_1.prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
};
exports.revokeAll = revokeAll;
