// src/lib/prisma-admin.ts
// Prisma Client sem middleware de segurança
// Use este cliente APENAS para operações administrativas

import { PrismaClient } from '@prisma/client'

const globalForAdminPrisma = globalThis as unknown as {
  adminPrisma: PrismaClient | undefined
}

export const adminPrisma = globalForAdminPrisma.adminPrisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForAdminPrisma.adminPrisma = adminPrisma

export default adminPrisma