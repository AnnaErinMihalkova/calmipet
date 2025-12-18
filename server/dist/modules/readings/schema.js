"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReadingSchema = exports.createReadingSchema = void 0;
const zod_1 = require("zod");
exports.createReadingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    value: zod_1.z.number().int(),
});
exports.updateReadingSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).optional(),
    value: zod_1.z.number().int().optional(),
});
