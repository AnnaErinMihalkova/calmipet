"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReading = exports.updateReading = exports.createReading = exports.getReading = exports.listReadings = void 0;
const client_1 = require("../../prisma/client");
const listReadings = async (userId) => {
    return client_1.prisma.reading.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};
exports.listReadings = listReadings;
const getReading = async (userId, id) => {
    const reading = await client_1.prisma.reading.findUnique({ where: { id } });
    if (!reading || reading.userId !== userId)
        throw Object.assign(new Error('Not found'), { status: 404 });
    return reading;
};
exports.getReading = getReading;
const createReading = async (userId, data) => {
    return client_1.prisma.reading.create({ data: { userId, title: data.title, value: data.value } });
};
exports.createReading = createReading;
const updateReading = async (userId, id, data) => {
    const existing = await client_1.prisma.reading.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId)
        throw Object.assign(new Error('Not found'), { status: 404 });
    return client_1.prisma.reading.update({ where: { id }, data });
};
exports.updateReading = updateReading;
const deleteReading = async (userId, id) => {
    const existing = await client_1.prisma.reading.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId)
        throw Object.assign(new Error('Not found'), { status: 404 });
    await client_1.prisma.reading.delete({ where: { id } });
    return { deleted: true };
};
exports.deleteReading = deleteReading;
