"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
// @ts-ignore
const morgan_1 = __importDefault(require("morgan"));
const error_1 = require("./middlewares/error");
const routes_1 = require("./modules/auth/routes");
const routes_2 = require("./modules/user/routes");
const routes_3 = require("./modules/readings/routes");
exports.app = (0, express_1.default)();
exports.app.use((0, cors_1.default)({ origin: '*', credentials: false }));
exports.app.use(express_1.default.json());
exports.app.use((0, morgan_1.default)('dev'));
exports.app.get('/health', (_req, res) => res.json({ ok: true }));
exports.app.use('/api/auth', routes_1.authRouter);
exports.app.use('/api/users', routes_2.userRouter);
exports.app.use('/api/readings', routes_3.readingRouter);
exports.app.use(error_1.errorHandler);
