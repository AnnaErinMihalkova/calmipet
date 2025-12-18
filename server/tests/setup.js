"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../src/prisma/client");
beforeEach(async () => {
    await client_1.prisma.refreshToken.deleteMany({});
    await client_1.prisma.reading.deleteMany({});
    await client_1.prisma.user.deleteMany({});
});
afterAll(async () => {
    await client_1.prisma.$disconnect();
});
