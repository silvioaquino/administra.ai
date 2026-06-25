// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'
import { securityMiddleware } from './prisma-middleware'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Criar instância do Prisma Client com o middleware de segurança
const createPrismaClient = () => {
  const client = new PrismaClient()
  return securityMiddleware(client)
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma