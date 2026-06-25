// src/lib/auth.ts
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

declare module "next-auth" {
  interface User {
    id: string
    name?: string | null
    email?: string | null
    establishment?: string | null
    whatsapp?: string | null
    segmento?: string | null
    trialEndsAt?: string
    subscriptionStatus?: string | null
    isInTrial?: boolean
    empresaId?: string | null
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      establishment?: string | null
      whatsapp?: string | null
      segmento?: string | null
      trialEndsAt?: string
      subscriptionStatus?: string | null
      isInTrial?: boolean
      empresaId?: string | null
    }
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Credenciais inválidas")
        }

        // Buscar usuário com os dados da empresa
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { empresas: { take: 1 } }
        })

        if (!user || !user.passwordHash) {
          throw new Error("Usuário não encontrado")
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error("Senha incorreta")
        }

        // Buscar subscription separadamente
        let subscription = null
        if (user.id) {
          subscription = await prisma.subscription.findFirst({
            where: {
              userId: user.id,
              status: "active"
            }
          })
        }

        // Verificar período trial
        const isInTrial = user.trialEndsAt && user.trialEndsAt > new Date()

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          establishment: user.empresas?.[0]?.nome || null,
          whatsapp: user.empresas?.[0]?.whatsapp || null,
          segmento: user.empresas?.[0]?.segmento || null,
          trialEndsAt: user.trialEndsAt?.toISOString(),
          subscriptionStatus: subscription?.status || null,
          isInTrial: isInTrial || false,
          empresaId: user.empresas?.[0]?.id || null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.establishment = user.establishment
        token.whatsapp = user.whatsapp
        token.segmento = user.segmento
        token.trialEndsAt = user.trialEndsAt
        token.subscriptionStatus = user.subscriptionStatus
        token.isInTrial = user.isInTrial
        token.empresaId = user.empresaId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.establishment = token.establishment as string
        session.user.whatsapp = token.whatsapp as string
        session.user.segmento = token.segmento as string
        session.user.trialEndsAt = token.trialEndsAt as string
        session.user.subscriptionStatus = token.subscriptionStatus as string
        session.user.isInTrial = token.isInTrial as boolean
        session.user.empresaId = token.empresaId as string
      }
      return session
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}