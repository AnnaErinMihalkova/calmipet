"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefresh = exports.signRefresh = exports.verifyAccess = exports.signAccess = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const signAccess = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.accessTokenSecret, { expiresIn: env_1.env.accessTokenTtl });
exports.signAccess = signAccess;
const verifyAccess = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.accessTokenSecret);
    if (typeof decoded === 'string')
        throw new Error('Unauthorized');
    const sub = decoded.sub;
    if (!sub)
        throw new Error('Unauthorized');
    return { sub: String(sub) };
};
exports.verifyAccess = verifyAccess;
const signRefresh = (payload) => jsonwebtoken_1.default.sign(payload, env_1.env.refreshTokenSecret, { expiresIn: env_1.env.refreshTokenTtl });
exports.signRefresh = signRefresh;
const verifyRefresh = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.refreshTokenSecret);
    if (typeof decoded === 'string')
        throw new Error('Unauthorized');
    const sub = decoded.sub;
    if (!sub)
        throw new Error('Unauthorized');
    return { sub: String(sub) };
};
exports.verifyRefresh = verifyRefresh;
