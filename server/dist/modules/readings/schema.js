"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateReadingSchema = exports.createReadingSchema = void 0;
const zod_1 = require("zod");
exports.createReadingSchema = zod_1.z.object({
    hr: zod_1.z.number().int().min(30).max(220),
    hrv: zod_1.z.number().min(10).max(200).optional().nullable(),
    ts: zod_1.z.union([zod_1.z.string().datetime(), zod_1.z.date()]).optional(),
});
exports.updateReadingSchema = zod_1.z.object({
    hr: zod_1.z.number().int().min(30).max(220).optional(),
    hrv: zod_1.z.number().min(10).max(200).optional().nullable(),
});
