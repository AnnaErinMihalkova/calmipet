"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jwt_1 = require("../libs/jwt");
const requireAuth = (req, res, next) => {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token)
        return res.status(401).json({ error: 'Unauthorized' });
    try {
        const payload = (0, jwt_1.verifyAccess)(token);
        req.userId = payload.sub;
        next();
    }
    catch {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};
exports.requireAuth = requireAuth;
