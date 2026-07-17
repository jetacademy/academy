import { PrismaClient } from "@prisma/client";

// Singleton supaya hot-reload dev tidak membuka koneksi MySQL berulang
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
