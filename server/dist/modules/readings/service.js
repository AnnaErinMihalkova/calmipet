"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReading = exports.updateReading = exports.createReading = exports.getReading = exports.findPaginated = exports.listReadings = void 0;
const client_1 = require("../../prisma/client");
const listReadings = async (userId) => {
    return client_1.prisma.reading.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
};
exports.listReadings = listReadings;
const findPaginated = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const take = limit;
    const [items, total] = await Promise.all([
        client_1.prisma.reading.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            skip,
            take,
        }),
        client_1.prisma.reading.count({ where: { userId } }),
    ]);
    const totalPages = Math.ceil(total / limit);
    return {
        items,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};
exports.findPaginated = findPaginated;
const getReading = async (userId, id) => {
    const reading = await client_1.prisma.reading.findUnique({
        where: { id },
        include: { user: { select: { id: true, username: true, email: true } } },
    });
    if (!reading || reading.userId !== userId)
        throw Object.assign(new Error('Not found'), { status: 404 });
    return reading;
};
exports.getReading = getReading;
const createReading = async (userId, data) => {
    const readingData = { userId, hr: data.hr };
    if (data.hrv !== undefined) {
        readingData.hrv = data.hrv;
    }
    if (data.ts) {
        readingData.createdAt = data.ts instanceof Date ? data.ts : new Date(data.ts);
    }
    return client_1.prisma.reading.create({ data: readingData });
};
exports.createReading = createReading;
const updateReading = async (userId, id, data) => {
    const existing = await client_1.prisma.reading.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId)
        throw Object.assign(new Error('Not found'), { status: 404 });
    const updateData = {};
    if (data.hr !== undefined)
        updateData.hr = data.hr;
    if (data.hrv !== undefined)
        updateData.hrv = data.hrv;
    return client_1.prisma.reading.update({ where: { id }, data: updateData });
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
